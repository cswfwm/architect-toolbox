// 常量名在不同游戏版本里会变（例如 ItemID.Table 不存在，只有 WoodenTable）。
// 用 in 探测后取值，探测不到就给 -1，避免整个模组因为一个名字加载失败。
const ItemID = Terraria.ID.ItemID;
const TileID = Terraria.ID.TileID;

export function Item(name) {
    return name in ItemID ? ItemID[name] : -1;
}

export function Tile(name) {
    return name in TileID ? TileID[name] : -1;
}

// 配方里不需要空槽。
export function Present(id) {
    return id > 0;
}
