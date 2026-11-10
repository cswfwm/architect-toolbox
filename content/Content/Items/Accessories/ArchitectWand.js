import { ToolboxAccessory } from './ToolboxAccessory.js';
import { Item, Tile, Present } from '../../../Common/Ids.js';

export class ArchitectWand extends ToolboxAccessory {
    get SlotId() { return 'ArchitectWand'; }

    SetDefaults() {
        super.SetDefaults();
        this.Item.rare = 4;
        this.Tooltip = '手持时点住方块即可把它收进蓝图\n一次点选同时收录光标那一格，配合 /architect capture 可整块收录';
    }

    AddRecipes() {
        const recipe = this.CreateRecipe()
            .AddIngredient(ModContent.ItemType('ArchitectTool'))
            .AddIngredient(Item('Wood'), 10)
            .AddIngredient(Item('Amethyst'));
        const bench = Tile('WorkBenches');
        if (Present(bench)) recipe.AddTile(bench);
        recipe.Register();
    }
}
