import { ToolboxData } from './ToolboxData.js';

const Main = Terraria.Main;

// 建筑师模式下手持物品放置方块不再受距离限制：
// 放置逻辑读的是玩家的取物范围，下一帧开始时再恢复原值。
export class ReachPlayer extends ModPlayer {
    savedRangeX = 0;
    savedRangeY = 0;

    PreUpdate(player) {
        if (this.savedRangeX > 0) {
            player.tileRangeX = this.savedRangeX;
            player.tileRangeY = this.savedRangeY;
            this.savedRangeX = 0;
            this.savedRangeY = 0;
        }
    }

    PostUpdate(player) {
        if (player.whoAmI !== Main.myPlayer) return;
        const data = player.GetModPlayer(ToolboxData);
        if (!data.ArchitectEnabled) return;

        this.savedRangeX = player.tileRangeX;
        this.savedRangeY = player.tileRangeY;
        // 视野半径（格）：屏幕宽高的一半，向下多留两格给地面。
        const halfW = Math.ceil(Main.screenWidth / 32) + 2;
        const halfH = Math.ceil(Main.screenHeight / 32) + 2;
        player.tileRangeX = Math.max(player.tileRangeX, halfW);
        player.tileRangeY = Math.max(player.tileRangeY, halfH);
    }
}
