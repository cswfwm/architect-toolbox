import { Tile, Present } from '../Ids.js';

const Main = Terraria.Main;

// 世界生成完成后，往一部分宝箱里放工程师眼镜和工程师搜索机。
// 与官方示例一致：只看箱子方块与空槽位，随机挑箱子，数量有上限。
const TARGET_TYPES = ['Containers', 'Containers2'].map(Tile).filter(Present);
const CHANCE = 3;      // 每 3 个符合条件的箱子放 1 件
const MAX_ITEMS = 6;

function IsContainerChest(chest) {
    if (chest == null || chest.x < 0) return false;
    const tile = Main.tile['Tile get_Item(int x, int y)'](chest.x, chest.y);
    return TARGET_TYPES.includes(tile.type);
}

function FirstEmptySlot(chest) {
    for (let i = 0; i < chest.item.length; i++) {
        const slot = chest.item[i];
        if (slot == null || slot.type <= 0) return i;
    }
    return -1;
}

export class ChestLoot extends ModSystem {
    PostWorldGen() {
        const glasses = ModContent.ItemType('EngineerGlasses');
        const scanner = ModContent.ItemType('EngineerScanner');
        let placed = 0;

        for (let index = 0; index < Main.maxChests; index++) {
            const chest = Main.chest[index];
            if (!IsContainerChest(chest)) continue;
            if (Rand.NextBool(CHANCE)) continue;

            const slot = FirstEmptySlot(chest);
            if (slot < 0) continue;
            const item = chest.item[slot];
            item.SetDefaults(placed % 2 === 0 ? glasses : scanner);
            item.stack = 1;
            placed++;
            if (placed >= MAX_ITEMS) return;
        }
    }
}
