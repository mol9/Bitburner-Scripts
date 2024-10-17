/** @param {NS} ns */
export async function main(ns) {
  while (true) {
    const members = ns.gang.getMemberNames();
    for (let _mem of members) {
      const memberInfo = ns.gang.getMemberInformation(_mem);

      const next_Point = ns.formulas.gang.ascensionPointsGain(memberInfo.hack_exp);
      const next_Mult = ns.formulas.gang.ascensionMultiplier(
        memberInfo.hack_asc_points + next_Point);

      const current_Mult = memberInfo.hack_asc_mult;

      if ((next_Mult / current_Mult) >= 1.1) {
        ns.gang.ascendMember(_mem);
        buyEquipment(_mem, ns);
      }
      else {
        buyEquipment(_mem, ns);
      }
    }
    
    await ns.sleep(1000);
  }

}

function buyEquipment(name, ns) {
  const equipment = ["DataJack", "Neuralstimulator", "BitWire", "Bionic Spine",
    "Bionic Arms", "Bionic Legs", "Graphene Bone Lacings", "Synthetic Heart",
    "BrachiBlades", "Nanofiber Weave", "Synfibril Muscle", "Baseball Bat",
    "Katana", "Glock 18C", "P90C", "Steyr AUG", "AK-47", "M15A10 Assault Rifle",
    "AWM Sniper Rifle", "Liquid Body Armor", "Bulletproof Vest", "Full Body Armor",
    "Graphene Plating Armor", "Ford Flex V20", "White Ferrari", "ATX1070 Superbike",
    "Mercedes-Benz S9001", "NUKE Rootkit", "Soulstealer Rootkit", "Demon Rootkit",
    "Hmap Node", "Jack the Ripper"];
  equipment.forEach((e) => {
    ns.gang.purchaseEquipment(name, e);
  });
}
