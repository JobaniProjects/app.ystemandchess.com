import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

export class Chess {
  stopTheGameFlag: boolean;
  color: string;
  chessBoard: any = (<HTMLFrameElement>document.getElementById(this.frameId))
    .contentWindow;
  moves: string[] = [];

  constructor(private frameId: string, private isLesson: boolean) {
    this.preGame();
  }

  private preGame() {
    var eventMethod = window.addEventListener
      ? 'addEventListener'
      : 'attachEvent';
    var eventer = window[eventMethod];
    var messageEvent = eventMethod == 'attachEvent' ? 'onmessage' : 'message';

    // Listen to message from child window
    eventer(
      messageEvent,
      (e) => {
        if (this.badCondition(e)) return;

        const isDataAFen = e.data.indexOf('/') > -1;

        const info = this.isLesson ? this.dataTransform(e.data) : e.data;
        const msg = this.createAmessage(info, this.color);
        this.chessBoard.postMessage(msg, environment.urls.chessClientURL);

        if (this.isLesson) {
          this.lessonOver(e, isDataAFen);
        } else if (!isDataAFen) {
          this.gameOver(e.data);
        } else if (this.chessBoard.game.fen()) {
          this.moves.push(this.chessBoard.game.fen());
        }
      },

      false
    );
  }

  public flipBoard() {
    this.chessBoard.flip();
  }

  public newGameInit(FEN?: string) {
    if (!FEN) {
      FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      this.moves = [];
    }
    const msg = this.createAmessage(FEN, this.color);
    this.chessBoard.postMessage(msg, environment.urls.chessClientURL);
    this.stopTheGameFlag = false;
  }

  public undoPrevMove() {
    console.log(this.moves);
    this.moves.pop();

    this.newGameInit(this.moves[this.moves.length - 1]);

    this.stopTheGameFlag = false;
  }

  private dataTransform(data) {
    if (data === 'ReadyToRecieve') data = '8/8/8/8/8/8/8/8 w - - 0 1';
    if (data.split('/')[7]) {
      let laststring = data.split('/')[7].split(' ');
      laststring[1] = 'w';
      laststring[2] = '-';
      laststring[3] = '-';
      laststring[4] = '0';
      laststring[5] = '1';
      laststring = laststring.join(' ');
      let tranfomed = data.split('/');
      tranfomed[7] = laststring;
      return tranfomed.join('/');
    }
    return data;
  }

  private createAmessage(fen: String, color: string) {
    return JSON.stringify({
      boardState: fen,
      color: color,
      lessonFlag: this.isLesson,
    });
  }

  private lessonOver(e: any, isDataAFen: boolean) {
    if (e.data.indexOf('p') === -1 && isDataAFen) {
      this.stopTheGameFlag = true;

      setTimeout(() => {
        Swal.fire('Lesson completed', 'Good Job', 'success');
        this.newGameInit();
      }, 200);
    }
  }

  private gameOver(condition) {
    if (condition != 'ReadyToRecieve' && condition != 'gameOver') {
      this.stopTheGameFlag = true;
      setTimeout(() => {
        Swal.fire(condition, 'Good Job', 'success');
      }, 200);
    }
  }

  private badCondition(e): boolean {
    if (!e || typeof e.data === 'object') return true;
    if (!e.data || this.stopTheGameFlag) return true;
    if (e.data === '8/8/8/8/8/8/8/8 w - - 0 1') return true;
    return false;
  }
}
