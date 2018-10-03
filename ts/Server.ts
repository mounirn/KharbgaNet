interface SignalR {
    gameHub: KharbgaHubProxy;
}

interface KharbgaHubProxy {

}

interface KharbgaHubProxy {
    client: IKharbgaClient;
    server: KharbgaServer;
}
interface IKharbgaClient {
    onMessagePosted(player : Kharbga.Player, message : string): void;
    onGameStateUpdated(status: boolean, message: string, game: Kharbga.GameInfo, player: Kharbga.Player): void;

}
interface KharbgaServer {
    send(name: string, message: string): JQueryPromise<void>;
}