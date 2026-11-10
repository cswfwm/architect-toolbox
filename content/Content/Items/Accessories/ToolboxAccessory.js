// 六件饰品的公共部分：戴在装备栏任意饰品位，或者由工具栏上的槽位驱动。
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
}
