// 低层游戏调用集中放这里：方法名按游戏 dumps 的签名取，避免各处拼字符串。
const Main = Terraria.Main;
const WorldGen = Terraria.WorldGen;

export const TileAt = (x, y) => Main.tile['Tile get_Item(int x, int y)'](x, y);
export const TileActive = (tile) => tile['bool active()']();

export const PlaceObject = WorldGen['bool PlaceObject(int x, int y, int type, bool mute, int style, int alternate, int random, int direction)'];
export const SquareTileFrame = WorldGen['void SquareTileFrame(int i, int j, bool resetFrame)'];

const GetTileData = Terraria.ObjectData.TileObjectData['TileObjectData GetTileData(int type, int style, int alternate)'];

// 家具/多格方块才有 TileObjectData；普通方块返回 null。
export function TileObjectDataOf(type) {
    try {
        return GetTileData(type, 0, 0);
    } catch (e) {
        return null;
    }
}

export const QuickSpawnItem = (player, type, stack) =>
    player['void QuickSpawnItem(IEntitySource source, int item, int stack)'](player.GetItemSource_Misc(0), type, stack);

export function chat(text) {
    Main.NewText(text, '#8FD3FF');
}

