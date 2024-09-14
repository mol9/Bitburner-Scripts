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

    if (ns.hasRootAccess(server) && ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel() && !ns.getPurchasedServers().includes(server) && ns.getServerMoneyAvailable(server)) {
      list.push(server);
    }
  })


  list.forEach((target, i) => {
    results[i] = ns.getServerMaxMoney(target);
    little_results[i] = ns.getServerMaxMoney(target) * ns.hackAnalyze(target);
  })

  return [list[maxElement(results)], list[maxElement(little_results)],list];
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

    await Promise.all(servers.map(async (server,idx) => {
      const ram = await ns.getServerMaxRam(server) - await ns.getServerUsedRam(server);
      if (ram >= 8 && server != 'home') {
        await hackServer(ns, server, hack_target, {
          grow_delay: weaken_time - grow_time - 2,
          hack_delay: weaken_time - hack_time - 1,
          ram
        });
      }else{
        await prepServer(ns, server, mini_target, {
          grow_delay: weaken_time - grow_time - 2,
          hack_delay: weaken_time - hack_time - 1,
          ram
        });
      }
    }))

    await ns.sleep(10);
  }
}

async function scpFiles(ns, target) {

  await ns.scp('targeted-grow.js', target);
  await ns.scp('targeted-hack.js', target);
  await ns.scp('targeted-weaken.js', target);
}

async function hackServer(ns, server, target, p) {
  const threads = Math.floor(p.ram / 1.75);

  const grow_threads = Math.floor(threads * 0.25);
  const hack_threads = Math.floor(threads * 0.25);
  const weaken_threads = Math.floor(threads * 0.5);


  ns.exec('targeted-weaken.js', server, weaken_threads, weaken_threads, target, 1);
  ns.exec('targeted-grow.js', server, grow_threads, grow_threads, p.grow_delay, target, 1);
  ns.exec('targeted-hack.js', server, hack_threads, hack_threads, p.hack_delay, target, 1);
}

async function prepServer(ns, server, target, p) {

  const grow_threads = 1;
  const weaken_threads = 1;


  ns.exec('targeted-weaken.js', server, weaken_threads, weaken_threads, target, 1);
  ns.exec('targeted-grow.js', server, grow_threads, grow_threads, p.grow_delay, target, 1);
}
