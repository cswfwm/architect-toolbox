import { ToolboxData } from '../../../Common/Players/ToolboxData.js';

// 六件饰品的公共部分：装进建筑师工具栏而不是原版饰品栏。
// 这个类本身不是内容，标记 Autoload = false，否则会被注册成一个新物品。
export class ToolboxAccessory extends ModItem {
    static Autoload = false;

    get SlotId() {
        return '';
    }

    SetDefaults() {
        this.Item.width = 26;
        this.Item.height = 26;
        this.Item.maxStack = 1;
        this.Item.accessory = true;
        this.Item.rare = 3;
        this.Item.value = Terraria.Item.sellPrice(0, 2, 0, 0);
    }

    UpdateAccessory(item, player, vanity, hideVisual) {
        if (vanity) return;
        player.GetModPlayer(ToolboxData).FillSlot(this.SlotId);
    }
}
