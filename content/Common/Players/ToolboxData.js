import { ToolboxConfig } from '../Configs/ToolboxConfig.js';
import { QuickSpawnItem, TileAt, TileActive, chat, TileObjectDataOf, PlaceObject, SquareTileFrame } from '../Core.js';

const Main = Terraria.Main;
const ItemID = Terraria.ID.ItemID;
const TileID = Terraria.ID.TileID;
const Recipe = Terraria.Recipe;

// 六件饰品的定义：id 与工具栏槽位顺序一致。
export const SLOT_DEFS = [
    { id: 'ArchitectTool', name: '建筑师工具', desc: '视野内自由放置、网格测距、蓝图' },
    { id: 'ArchitectSuite', name: '建筑师制造套装', desc: '随身肉前工作台' },
    { id: 'ArchitectSuite2', name: '建筑师制造套装 2', desc: '随身肉后工作台' },
    { id: 'EngineerGlasses', name: '工程师眼镜', desc: '自动锁定并射击最近的敌人' },
    { id: 'ArchitectWand', name: '建筑师蓝图法杖', desc: '点住方块收录进蓝图' },
    { id: 'EngineerScanner', name: '工程师搜索机', desc: '附近容器检索' },
];

// 肉前可获得的工作台类型。原版这些站的编号与物品一一对应或见 EXTRA_TILES。
export const SUITE1_TILES = [
    TileID.WorkBenches, TileID.Furnaces, TileID.Anvils, TileID.Bottles,
    TileID.Tables, TileID.Chairs, TileID.Loom, TileID.Kegs,
    TileID.Sawmill, TileID.Hellforge, TileID.DyeVat, TileID.CookingPots,
    TileID.HeavyWorkBench, TileID.TinkerersWorkbench, TileID.HoneyDispenser,
];


// 方块类型 -> 放置它的原版物品。多数建材二者编号相同，家具与平台另行列出；
// 蓝图只收这张表里的方块，避免把床、门这类多格家具放歪。
const EXTRA_TILES = new Map([
    [TileID.Platforms, ItemID.WoodPlatform],
    [TileID.DyeVat, ItemID.DyeVat],
    [TileID.Tables, ItemID.Table],
    [TileID.WoodenTable, ItemID.WoodenTable],
    [TileID.WoodenChair, ItemID.WoodenChair],
    [TileID.WoodenDoor, ItemID.WoodenDoor],
    [TileID.WorkBenches, ItemID.WorkBench],
    [TileID.Bookcases, ItemID.Bookcase],
    [TileID.Furnaces, ItemID.Furnace],
    [TileID.Anvils, ItemID.IronAnvil],
    [TileID.MythrilAnvil, ItemID.MythrilAnvil],
    [TileID.AdamantiteForge, ItemID.AdamantiteForge],
    [TileID.Bottles, ItemID.Bottle],
    [TileID.Kegs, ItemID.Keg],
    [TileID.Loom, ItemID.Loom],
    [TileID.Sawmill, ItemID.Sawmill],
    [TileID.Chairs, ItemID.Chair],
    [TileID.Torches, ItemID.Torch],
    [TileID.Campfire, ItemID.Campfire],
    [TileID.HeartLantern, ItemID.HeartLantern],
    [TileID.StarinaBottle, ItemID.StarinaBottle],
    [TileID.CrystalBall, ItemID.CrystalBall],
    [TileID.HeavyWorkBench, ItemID.HeavyWorkBench],
    [TileID.Solidifier, ItemID.Solidifier],
    [TileID.Autohammer, ItemID.Autohammer],
    [TileID.Hellforge, ItemID.Hellforge],
    [TileID.CookingPots, ItemID.CookingPot],
    [TileID.TinkerersWorkbench, ItemID.TinkerersWorkbench],
    [TileID.HoneyDispenser, ItemID.HoneyDispenser],
]);

export function TileItemOf(tileType) {
    const extra = EXTRA_TILES.get(tileType);
    if (extra != null) return extra;
    return tileType > 0 && tileType < ItemID.Count ? tileType : 0;
}

export class BlueprintCell {
    constructor(type, style) {
        this.type = type;
        this.style = style ?? 0;
    }
}

export class ToolboxSlot {
    constructor(def) {
        this.def = def;
        this.Kind = def.id;
        this.Filled = false;
    }
}

export class ToolboxData extends ModPlayer {
    Slots = [];
    // "x,y" -> BlueprintCell，坐标相对蓝图左上角。
    Blueprint = new Map();
    // 搜索机悬浮球位置（UI 坐标）与展开状态。
    OrbX = 30;
    OrbY = 90;
    OrbOpen = false;
    // 眼镜栏里的那把远程武器（类型）；0 表示空。
    GlassesWeaponType = 0;
    // 每帧的锁定结果，供准星绘制。
    HasAimTarget = false;
    AimTargetX = 0;
    AimTargetY = 0;

    Initialize() {
        this.Slots = SLOT_DEFS.map((def) => new ToolboxSlot(def));
    }

    FindSlot(id) {
        return this.Slots.find((slot) => slot.Kind === id);
    }

    SlotFilled(id) {
        const slot = this.FindSlot(id);
        return !!slot && slot.Filled;
    }

    FillSlot(id) {
        const slot = this.FindSlot(id);
        if (slot) slot.Filled = true;
    }

    get ArchitectEnabled() { return this.SlotFilled('ArchitectTool'); }
    get Suite1Enabled() { return this.SlotFilled('ArchitectSuite'); }
    get Suite2Enabled() { return this.SlotFilled('ArchitectSuite2'); }
    get GlassesEnabled() { return this.SlotFilled('EngineerGlasses'); }
    get ScannerEnabled() { return this.SlotFilled('EngineerScanner'); }
    get WandEnabled() { return this.SlotFilled('ArchitectWand'); }

    // ---- 存档 ----
    SaveData(tag) {
        tag.Set('slots', JSON.stringify(this.Slots.map((slot) => (slot.Filled ? slot.Kind : ''))));
        const cells = [];
        for (const [key, cell] of this.Blueprint) cells.push(`${key}:${cell.type},${cell.style}`);
        tag.Set('bp', cells.join(';'));
        tag.Set('orbX', this.OrbX);
        tag.Set('orbY', this.OrbY);
        tag.Set('glassesWeapon', this.GlassesWeaponType);
    }

    LoadData(tag) {
        let kinds = [];
        try {
            kinds = JSON.parse(tag.GetString('slots') || '[]');
        } catch (e) {
            kinds = [];
        }
        this.Slots.forEach((slot, index) => {
            slot.Filled = kinds[index] === slot.Kind;
        });

        this.Blueprint.clear();
        const raw = tag.GetString('bp');
        if (raw) {
            for (const entry of raw.split(';')) {
                if (!entry) continue;
                const [key, rest] = entry.split(':');
                const [type, style] = (rest || '').split(',').map(Number);
                if (type > 0) this.Blueprint.set(key, new BlueprintCell(type, style));
            }
        }
        this.OrbX = tag.GetInt('orbX') || 30;
        this.OrbY = tag.GetInt('orbY') || 90;
        this.GlassesWeaponType = tag.GetInt('glassesWeapon');
    }

    // 开新角色时发放基础建筑师工具。
    AddStartingItems(player, mediumCoreDeath) {
        const gift = new Terraria.Item();
        gift.SetDefaults(ModContent.ItemType('ArchitectTool'));
        return [gift];
    }

    // ---- 蓝图 ----
    SetCell(x, y, type, style) {
        if (type <= 0) {
            this.Blueprint.delete(`${x},${y}`);
            return;
        }
        this.Blueprint.set(`${x},${y}`, new BlueprintCell(type, style));
    }

    HasCell(x, y) {
        return this.Blueprint.has(`${x},${y}`);
    }

    // 预览用：这个方块现在能不能放（只看背包材料与格子是否空着）。
    CanPlacePreview(tileType) {
        const itemType = TileItemOf(tileType);
        return itemType > 0 && this.CountItem(itemType) > 0;
    }

    ClearBlueprint() {
        this.Blueprint.clear();
    }

    get BlueprintSize() {
        return this.Blueprint.size;
    }

    Needs() {
        const needs = new Map();
        for (const cell of this.Blueprint.values()) {
            const itemType = TileItemOf(cell.type);
            if (itemType <= 0) continue;
            needs.set(itemType, (needs.get(itemType) ?? 0) + 1);
        }
        return needs;
    }

    CountItem(type) {
        let total = 0;
        for (const item of Main.player[Main.myPlayer].inventory) {
            if (item && item.type === type) total += item.stack;
        }
        return total;
    }

    // 材料清单：[{ itemType, need, have, missing }]
    Materials() {
        const list = [];
        for (const [itemType, need] of this.Needs()) {
            const have = this.CountItem(itemType);
            list.push({ itemType, need, have, missing: Math.max(0, need - have) });
        }
        list.sort((a, b) => b.missing - a.missing);
        return list;
    }

    MaterialsSummary() {
        const missing = this.Materials().filter((entry) => entry.missing > 0);
        if (missing.length === 0) return '材料齐全';
        const head = missing.slice(0, 3)
            .map((entry) => `${Terraria.Lang.GetItemNameValue(entry.itemType)} x${entry.missing}`)
            .join('，');
        return missing.length > 3 ? `${head} 等 ${missing.length} 种` : head;
    }

    // ---- 随身工作台 ----
    StationAvailable(tileType) {
        if (this.Suite2Enabled) return true;
        if (this.Suite1Enabled) return SUITE1_TILES.includes(tileType);
        const player = Main.player[Main.myPlayer];
        return player.adjTile != null && player.adjTile[tileType] === true;
    }

    FindRecipeFor(itemType) {
        for (let i = 0; i < Recipe.numRecipes; i++) {
            const recipe = Main.recipe[i];
            if (recipe == null || recipe.createItem == null) continue;
            if (recipe.createItem.type !== itemType) continue;

            const ingredients = [];
            for (const ingredient of recipe.requiredItem) {
                if (ingredient == null || ingredient.type <= 0 || ingredient.stack <= 0) continue;
                ingredients.push({ type: ingredient.type, count: ingredient.stack });
            }
            if (ingredients.length === 0) continue;

            const stations = recipe.requiredTile.filter((tile) => tile >= 0);
            return { Result: itemType, Ingredients: ingredients, Stations: stations, Stack: recipe.createItem.stack || 1 };
        }
        return null;
    }

    CanObtain(itemType, depth) {
        if (depth > 5) return false;
        if (this.CountItem(itemType) > 0) return true;
        const recipe = this.FindRecipeFor(itemType);
        if (recipe == null) return false;
        if (!recipe.Stations.every((station) => this.StationAvailable(station))) return false;
        return recipe.Ingredients.every((ingredient) => this.CanObtain(ingredient.type, depth + 1));
    }

    // 从最底层往上做：先补子材料，再做目标物品。
    CraftTree(itemType, amount, depth) {
        if (depth > 5) return false;
        if (this.CountItem(itemType) >= amount) return true;
        const recipe = this.FindRecipeFor(itemType);
        if (recipe == null) return false;
        if (!recipe.Stations.every((station) => this.StationAvailable(station))) return false;

        for (const ingredient of recipe.Ingredients) {
            const owned = this.CountItem(ingredient.type);
            if (owned >= ingredient.count) continue;
            if (!this.CraftTree(ingredient.type, ingredient.count - owned, depth + 1)) return false;
        }
        for (const ingredient of recipe.Ingredients) this.TakeItems(ingredient.type, ingredient.count);
        QuickSpawnItem(Main.player[Main.myPlayer], itemType, recipe.Stack);
        return true;
    }

    TakeItems(type, count) {
        let left = count;
        for (const item of Main.player[Main.myPlayer].inventory) {
            if (!item || item.type !== type) continue;
            const take = Math.min(left, item.stack);
            item.stack -= take;
            left -= take;
            if (item.stack <= 0) item['void TurnToAir(bool wideNet)'](false);
            if (left <= 0) return true;
        }
        return left <= 0;
    }

    AutoCraftForBlueprint() {
        if (!ModContent.GetInstance(ToolboxConfig).AutoCraft) {
            chat('自动制作已在设置里关闭');
            return;
        }
        const missing = this.Materials().filter((entry) => entry.missing > 0);
        if (missing.length === 0) {
            chat('材料已经齐全');
            return;
        }
        let crafted = 0;
        for (const entry of missing) {
            if (this.CraftTree(entry.itemType, entry.need, 0)) crafted++;
        }
        chat(crafted > 0 ? `自动制作完成：${crafted} 种材料` : '缺少工作台或原材料，无法自动制作');
    }

    // ---- 放置 ----
    // 以 (originX, originY) 为蓝图左上角；instant 为 false 时每次只放 40 格。
    Build(originX, originY, instant) {
        if (this.Blueprint.size === 0) {
            chat('蓝图里还没有方块');
            return 0;
        }
        let placed = 0;
        let minX = originX;
        let minY = originY;
        let maxX = originX;
        let maxY = originY;
        for (const [key, cell] of this.Blueprint) {
            const [dx, dy] = key.split(',').map(Number);
            const x = originX + dx;
            const y = originY + dy;
            if (!CanPlaceAt(x, y)) continue;
            const itemType = TileItemOf(cell.type);
            if (itemType <= 0 || this.CountItem(itemType) <= 0) continue;
            this.PlaceOne(x, y, cell.type, cell.style);
            this.TakeItems(itemType, 1);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            placed++;
            if (!instant && placed >= 40) break;
        }
        if (placed > 0) {
            if (Main.netMode !== 0) SyncArea(minX, minY, maxX - minX + 1, maxY - minY + 1);
            chat(`已放置 ${placed} 格`);
        }
        return placed;
    }

    PlaceOne(x, y, tileType, style) {
        const tile = TileAt(x, y);
        if (TileObjectDataOf(tileType) != null) {
            PlaceObject(x, y, tileType, true, style || 0, 0, -1, -1);
            return;
        }
        tile['void ResetToType(ushort type)'](tileType);
        tile.TileFrameX = (short)(18 * (style || 0));
        SquareTileFrame(x, y, true);
    }
}

const SendTileSquare = Terraria.NetMessage['void SendTileSquare(int whoAmi, int tileX, int tileY, int xSize, int ySize, TileChangeType changeType)'];

function SyncArea(x, y, w, h) {
    if (Main.netMode & 2) SendTileSquare(-1, x, y, w, h, 0);
}

export function CanPlaceAt(x, y) {
    if (x < 1 || y < 1 || x >= Main.maxTilesX - 1 || y >= Main.maxTilesY - 1) return false;
    return !TileActive(TileAt(x, y));
}
