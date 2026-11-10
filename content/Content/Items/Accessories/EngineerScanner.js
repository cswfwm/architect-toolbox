import { ToolboxAccessory } from './ToolboxAccessory.js';

export class EngineerScanner extends ToolboxAccessory {
    get SlotId() { return 'EngineerScanner'; }

    SetDefaults() {
        super.SetDefaults();
        this.Item.rare = 4;
        this.Tooltip = '在附近 10 格的范围内检索箱子和容器\n装备后左上角出现悬浮球，点开可按中文、拼音或英文首字母查找物品';
    }
}
