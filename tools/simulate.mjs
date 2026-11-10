// 用 Proxy 桩模拟 Bunny-Loader 全局，实际 import 每个模组文件，跑生命周期。
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';

const passthrough = () => new Proxy(function () {}, {
    get: (t, p) => (p === Symbol.toPrimitive ? () => 0 : p === 'then' ? undefined : passthrough()),
    apply: () => passthrough(),
    construct: () => passthrough(),
});

function makeClass(name, statics = {}) {
    const C = class { constructor() { this.__type = name; } };
    Object.defineProperty(C, 'name', { value: name });
    return new Proxy(C, {
        get(t, p) {
            if (p in statics) return statics[p];
            if (p in t) return t[p];
            const v = passthrough();
            t[p] = v;
            return v;
        },
    });
}

const classes = ['Item','NPC','Projectile','Player','Main','Dust','SoundID','ItemID','NPCID','ProjectileID',
  'AmmoID','BuffID','TileID','ItemRarityID','ItemUseStyleID','DustID','Lang','SoundEngine','ModItem','ModNPC',
  'ModProjectile','ModBuff','ModPlayer','ModSystem','Mod','ModContent','ModConfig','ModRecipe','ModLoader',
  'DamageClass','TooltipLine','ModLocalization','TagCompound','UIState','UIElement','UIPanel','UIText','UIImage',
  'UIImageButton','UserInterface','LegacyGameInterfaceLayer','InterfaceScaleType','Vector2','Color','Rectangle',
  'MathHelper','Rand','Ref','TextureAssets','ItemSlot','Recipe','ContentSamples','WorldGen','TileObjectData','ModCommand','CommandType'];
for (const c of classes) globalThis[c] = makeClass(c);
globalThis.Color.new = () => ({});
globalThis.Rectangle.new = () => ({});
globalThis.Vector2.new = () => ({ X: 0, Y: 0 });
globalThis.Recipe.numRecipes = 0;
globalThis.ModConfig.Toggle = () => ({});
globalThis.ModConfig.Range = () => ({});
globalThis.ModConfig.Radio = () => ({});
globalThis.ModContent.GetInstance = () => ({ AutoCraft: true, ShowMaterials: true, InstantBlueprint: true, AmmoPriority: '背包优先', AimRange: 40, SearchRange: 10 });
globalThis.ModContent.ItemType = (n) => 1000;
globalThis.ItemID.Count = 5455;
globalThis.TileID.Count = 700;
globalThis.UICommon = { TooltipMouseText: () => {} };
globalThis.ModRecipe = class {
    SetResult() { return this; } AddIngredient() { return this; } AddTile() { return this; }
    Register() { return this; } AddRecipeGroup() { return this; } SetProperty() { return this; }
    AddCondition() { return this; }
};
globalThis.UIState = class { Append() {} Activate() {} OnInitialize() {} Update() {} Draw() {} };
globalThis.UIElement = class { constructor() { this.Left = { Set() {} }; this.Top = { Set() {} }; this.Width = { Set() {} }; this.Height = { Set() {} }; } SetPadding() {} GetDimensions() { return { X: 0, Y: 0, W: 0, H: 0 }; } GetInnerDimensions() { return this.GetDimensions(); } ContainsPoint() { return false; } Update() {} DrawSelf() {} Append() {} };
globalThis.UIPanel = class extends globalThis.UIElement { constructor() { super(); } };
globalThis.UserInterface = class { SetState() {} Update() {} Draw() {} };

function deepStub(name) {
    return new Proxy(function () {}, {
        get(t, p) {
            if (p === 'then') return undefined;
            if (p === Symbol.toPrimitive) return () => 0;
            return deepStub(String(p));
        },
        apply: () => deepStub('call'),
        construct: () => ({}),
    });
}
globalThis.Microsoft = deepStub('Microsoft');
globalThis.Terraria = deepStub('Terraria');
globalThis.Terraria.Main = deepStub('Main');
globalThis.Terraria.ID = { ItemID: globalThis.ItemID, TileID: globalThis.TileID, AmmoID: deepStub('AmmoID') };
globalThis.bl = { log: () => {}, chat: () => {} };

const files = [];
(function walk(dir) {
    for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (f.endsWith('.js')) files.push(p);
    }
})('content');

let failed = 0;
const loaded = [];
for (const f of files) {
    try {
        loaded.push([f, await import(pathToFileURL(f).href)]);
    } catch (e) {
        failed++;
        console.log('FAIL import', f, '->', e.message.split('\n')[0]);
    }
}
console.log(`import 完成：${files.length} 个文件，失败 ${failed}`);

// 实例化每个导出类并跑生命周期
let instances = 0;
const SKIP = new Set(['BlueprintCell','ToolboxSlot','ToolbarPanel','BlueprintPanel','GlassesPanel','ScannerOrb',
    'ToolbarState','ScannerState','Frame','ItemName','KillTile','NewItem','PlaceObject','PlaceTile','QuickSpawnItem',
    'SquareTileFrame','TileActive','TileAt','TileObjectDataOf','TileType','WallType','canBlueprint','chat','inWorld',
    'isVanillaItem','isVanillaTile','recipeItemToType','ChestContents','FindNearestTarget','PickAmmo','ScanChests',
    'WeaponTotals','CanPlaceAt','TileItemOf','SearchItems','DrawWorldOverlay']);
for (const [f, mod] of loaded) {
    for (const [name, Exp] of Object.entries(mod)) {
        if (typeof Exp !== 'function' || SKIP.has(name)) continue;
        let inst;
        try {
            inst = new Exp();
        } catch (e) {
            failed++;
            console.log('FAIL new', name, '->', e.message.split('\n')[0]);
            continue;
        }
        instances++;
        try { inst.Type = 1000; } catch (e) { /* 只读 */ }
        inst.Item = deepStub('Item');
        inst.Mod = { id: 'architecttoolbox' };
        inst.CreateRecipe = () => new globalThis.ModRecipe();
        for (const method of ['SetStaticDefaults', 'SetDefaults', 'AddRecipes', 'Initialize', 'PostSetupContent',
                              'OnInitialize', 'UpdateUI', 'ModifyInterfaceLayers']) {
            if (typeof inst[method] !== 'function') continue;
            try {
                if (method === 'ModifyInterfaceLayers') {
                    const layers = [];
                    layers.FindIndex = (fn) => layers.findIndex(fn);
                    layers.Insert = (index, value) => layers.splice(index, 0, value);
                    inst[method](layers);
                } else {
                    inst[method]();
                }
            } catch (e) {
                failed++;
                console.log('FAIL', name + '.' + method, '->', e.message.split('\n')[0]);
            }
        }
    }
}
console.log(`${instances} 个实例，共 ${failed} 处失败`);
process.exit(failed ? 1 : 0);
