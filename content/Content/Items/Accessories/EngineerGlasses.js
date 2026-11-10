import { ToolboxAccessory } from './ToolboxAccessory.js';

export class EngineerGlasses extends ToolboxAccessory {
    get SlotId() { return 'EngineerGlasses'; }

    SetDefaults() {
        super.SetDefaults();
        this.Item.rare = 5;
        this.Tooltip = '自动锁定最近的敌人并开火\n工具栏上会出现独立的武器格，放一把远程武器\n需要背包或弹药栏里有可用弹药';
    }
}
