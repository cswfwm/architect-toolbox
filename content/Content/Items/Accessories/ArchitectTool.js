import { ToolboxAccessory } from './ToolboxAccessory.js';
import { Item, Tile, Present } from '../../../Common/Ids.js';

export class ArchitectTool extends ToolboxAccessory {
    get SlotId() { return 'ArchitectTool'; }

    SetDefaults() {
        super.SetDefaults();
        this.Item.rare = 4;
        this.Tooltip = '装备后开启建筑师模式：视野内自由放置、网格与测距、蓝图构建\n放进建筑师工具栏可长期生效';
    }

    AddRecipes() {
        const recipe = this.CreateRecipe()
            .AddIngredient(Item('Wood'), 20)
            .AddIngredient(Item('Gel'), 5);
        const bench = Tile('WorkBenches');
        if (Present(bench)) recipe.AddTile(bench);
        recipe.Register();
    }
}
