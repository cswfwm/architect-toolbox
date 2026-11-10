import { ToolboxData } from '../Players/ToolboxData.js';

// 建筑师工具戴在原版饰品栏上时，工具栏自动亮起，
// 玩家随后可以把工具放回背包、改放进工具栏槽位。
export class EquipmentSync extends ModPlayer {
    UpdateEquip(player) {
        if (player.whoAmI !== Terraria.Main.myPlayer) return;
        const data = player.GetModPlayer(ToolboxData);
        if (data.ArchitectEnabled) return;
        const wanted = ModContent.ItemType('ArchitectTool');
        for (const item of player.armor) {
            if (item != null && item.type === wanted) {
                data.FillSlot('ArchitectTool');
                return;
            }
        }
    }
}
