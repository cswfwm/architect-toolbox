import { ToolboxData, SUITE1_TILES } from '../Players/ToolboxData.js';

const Main = Terraria.Main;
const Player = Terraria.Player;

// 随身工作台：把套装里的工作台补进玩家的“附近站台”表，
// 这样原版合成界面直接用得上，不必跑到工作台旁边。
export class PortableStations extends ModSystem {
    PostUpdatePlayers() {
        const player = Main.player[Main.myPlayer];
        if (player == null || !player.active) return;

        const data = player.GetModPlayer(ToolboxData);
        if (!data.Suite1Enabled && !data.Suite2Enabled) return;

        const adj = player.adjTile;
        if (adj == null) return;
        for (let tile = 0; tile < adj.length; tile++) {
            if (data.Suite2Enabled || SUITE1_TILES.includes(tile)) adj[tile] = true;
        }
    }
}
