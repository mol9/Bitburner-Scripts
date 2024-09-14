/** @param {NS} ns **/
import { multiscan, gainRootAccess } from "utils.js";

function maxElement(arr) {
  let max = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i]
    }
  }

  let maxE = arr.indexOf(max);
  return maxE
}

export function best_target(ns, arr) {
  let list = [];
  let results = [];
  let little_results = [];
  arr.forEach(server => {
    if (!ns.hasRootAccess(server)) {
      gainRootAccess(ns, server);
    }

    if (ns.hasRootAccess(server) && ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel()) {
      list.push(server);
    }
  })


  list.forEach((target, i) => {
    results[i] = ns.getServerMaxMoney(target);
    little_results[i] = ns.getServerMaxMoney(target) * ns.hackAnalyze(target);
  })

  return [list[maxElement(results)], list[maxElement(little_results)], list];
}
export async function main(ns) {
  let reserved_RAM = ns.args[0];
  if (reserved_RAM == null) {
    reserved_RAM = 0;
  }
  let prep = false;
  while (true) {
    let full_list = multiscan(ns, 'home');

    // finds most profitable server to target
    const targets = best_target(ns, full_list);
    // ns.print(targets)
    const hack_target = targets[0];
    const mini_target = targets[1];
    const servers = targets[2];
    if (!prep) {
      await Promise.all(servers.map(async e => { await scpFiles(ns, e) }));
      prep = false;
    }


    const weaken_time = ns.getWeakenTime(hack_target);
    const grow_time = ns.getGrowTime(hack_target);
    const hack_time = ns.getHackTime(hack_target);

    await Promise.all(servers.map(async (server, idx) => {
      const totalRAM = await ns.getServerMaxRam(server);
      // const ram =  totalRAM - await ns.getServerUsedRam(server);
      if (totalRAM >= 8) {
        await hackServer(ns, server, hack_target, {
          grow_delay: weaken_time - grow_time + 1,
          hack_delay: weaken_time - hack_time - 1,
          weaken_delay: 2,
          totalRAM
        });
      } else {
        await prepServer(ns, server, mini_target, {
          grow_delay: weaken_time - grow_time - 2,
          hack_delay: weaken_time - hack_time - 1,
          totalRAM
        });
      }
    }))

    await ns.sleep(100);
  }
}

async function scpFiles(ns, target) {

  await ns.scp('targeted-grow.js', target);
  await ns.scp('targeted-hack.js', target);
  await ns.scp('targeted-weaken.js', target);
}

async function hackServer(ns, server, target, p) {
  const ram =  p.totalRAM - await ns.getServerUsedRam(server);
  const threads = Math.floor(ram/ 1.75);

  let grow_threads = Math.floor(threads * 0.25);
  let hack_threads = Math.floor(threads * 0.25);
  let weaken_threads = Math.floor(threads * 0.25);
  if (grow_threads < 1) grow_threads = 1;
  if (hack_threads < 1) hack_threads = 1;
  if (weaken_threads < 1) weaken_threads = 1;

  if (!ns.scriptRunning('targeted-weaken.js', server)) {
    ns.exec('targeted-weaken.js', server, weaken_threads, weaken_threads, 0, target, 1);
    ns.exec('targeted-hack.js', server, hack_threads, hack_threads, p.hack_delay, target, 1);
    ns.exec('targeted-grow.js', server, grow_threads, grow_threads, p.grow_delay, target, 1);
    ns.exec('targeted-weaken.js', server, weaken_threads, weaken_threads, p.weaken_delay, target, 1);
  }
}

async function prepServer(ns, server, target, p) {
  const threads = Math.floor(p.totalRAM / 1.75);

  let grow_threads = Math.floor(threads * 0.5);
  let weaken_threads = Math.floor(threads * 0.5);
  if (grow_threads < 1) grow_threads = 1;
  if (weaken_threads < 1) weaken_threads = 1;


  ns.exec('targeted-weaken.js', server, weaken_threads, weaken_threads, 0, target, 1);
  ns.exec('targeted-grow.js', server, grow_threads, grow_threads, p.grow_delay, target, 1);
}
