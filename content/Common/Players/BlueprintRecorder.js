import { ToolboxData } from './ToolboxData.js';
import { chat } from '../Core.js';

const Main = Terraria.Main;

// 蓝图录入的两种方式：
// 1) 手持蓝图法杖点住方块 → 把光标那一格收录进蓝图；
// 2) 输入 /architect 命令：把光标附近一块区域收录进蓝图。
export class BlueprintRecorder extends ModPlayer {
    // 手持蓝图法杖按住时，把光标所在格收录进蓝图。
    PostUpdate(player) {
        const data = player.GetModPlayer(ToolboxData);
        if (!data.ArchitectEnabled) return;

        const usedItem = player.inventory[player.selectedItem];
        if (usedItem == null || usedItem.type !== ModContent.ItemType('ArchitectWand')) return;
        if (!Main.mouseLeft) return;

        const gx = Math.floor(Main.MouseWorld.X / 16);
        const gy = Math.floor(Main.MouseWorld.Y / 16);
        if (gy < 1 || gy > Main.maxTilesY - 2 || gx < 1 || gx > Main.maxTilesX - 2) return;

        const tile = Terraria.Main.tile['Tile get_Item(int x, int y)'](gx, gy);
        if (!tile['bool active()']()) return;
        data.SetCell(gx, gy, tile.type, 0);
    }

    // 把以 (cx, cy) 为中心、宽 w 高 h 的已有方块整块收录。
    static CaptureArea(player, cx, cy, w, h) {
        const data = player.GetModPlayer(ToolboxData);
        let added = 0;
        for (let dx = 0; dx < w; dx++) {
            for (let dy = 0; dy < h; dy++) {
                const x = cx + dx;
                const y = cy + dy;
                if (y < 1 || y > Main.maxTilesY - 2 || x < 1 || x > Main.maxTilesX - 2) continue;
                const tile = Main.tile['Tile get_Item(int x, int y)'](x, y);
                if (!tile['bool active()']()) continue;
                data.SetCell(x - cx, y - cy, tile.type, 0);
                added++;
            }
        }
        chat(`已收录 ${added} 格到蓝图`);
        return added;
    }
}
