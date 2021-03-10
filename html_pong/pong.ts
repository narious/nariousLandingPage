import { interval, fromEvent, from, zip, pipe, Observable, ObservableInput, FactoryOrValue } from 'rxjs'
import { map, scan, filter, merge, flatMap, take, concat, takeUntil, switchMap, repeat} from 'rxjs/operators'
function pong() {
    
    /**
     * Model
     * Getting and maniupulating interacting with HTML 
     * Model communicate with controller (request data)
     */
    
     //Selecting elements of game board to use 


    const 
      leftpaddle = document.getElementById("leftpaddle"),
      rightpaddle = document.getElementById("rightpaddle"),
      ball = document.getElementById("ball"),
      scoreplayer1 = document.getElementById("scoreplayer1"),
      scoreplayer2 = document.getElementById("scoreplayer2"),
      canvas = document.getElementById("canvas");

      //Game options settings
      const 
      Constants = new class {
        readonly CanvasSize = parseInt(canvas.getAttribute('width'));
        readonly DefaultLeftPaddle = [20, 250];
        readonly DefaultRightPaddle = [570, 250];
        readonly PaddleAcceleration = 1.01;
        readonly PaddleStartVelocity = 1;
        //SVG element height and width extends from top left corner position (x,y) e.g. -5->x+|--width10->| = |--15--|
        readonly PaddleHeight = parseInt(leftpaddle.getAttribute("height"));
        readonly PaddleWidth = parseInt(leftpaddle.getAttribute("width"));
        readonly VelocityTransferEfficiency = 0.20;
        readonly VelocityReflectEfficiency = 0.9;
        readonly EdgeMultiplier = 1.2;
        readonly EdgeLocationPortion = 4; //The larger the bigger the potion
        readonly BallMinimumVelocity = 3;
        readonly StartBallDirection = 270;
        readonly BallX = parseInt(canvas.getAttribute('width'))/2;
        readonly BallY = parseInt(canvas.getAttribute('width'))/2
        readonly BallHeight = parseInt(ball.getAttribute("height"));
        readonly BallWidth = parseInt(ball.getAttribute("width"));
        readonly BallMass = 10;
        readonly BallFireDirectionLeft = 270;
        readonly BallFireDirectionRight = 90;
        readonly BlastMaxSize = 300;
        readonly Epsilon = 0.001;
        readonly BlastMass= 10;
        readonly BlastSizeRate = 1.5;
        readonly ChargeRate = 1;
        readonly StartingCharge = -5; //Similar to a charge delay
        readonly MinimumCharge = 5; //Sets the smallest possible size
        readonly MaximumCharge = 100;
        readonly BlastExpiry = 500;
        readonly ScoreWidth = 15;
        readonly RotationAcc = 0.1;
        readonly ThrustAcc = 0.1;
        readonly StartTime = 0;
        readonly RoundDelay = 50;
      }
    
    /**
     * The following class list documents the possible actions you can preform in the game
     */
    class Tick {constructor(public readonly elapsed:number) {}};
    class Move {constructor(public readonly direction: Vec) {}};
    class Pause {constructor() {}};
    class Restart{constructor(){}};
    class Click {constructor(public readonly x: number, public readonly y:number){}};
    class Blast {constructor(public readonly x: number) {}}; //the number is who fired the blast 
    class MouseLeave{constructor() {}};
    class MouseEnter{constructor() {}};
    
    type Action = Tick | Move | Pause |Restart | Click | MouseLeave | MouseEnter

    type Event = 'keydown' | 'keyup' | 'mousedown' | 'mousemove' | 'mouseleave' | 'mouseenter'
    type Key = 'ArrowUp' | 'ArrowDown' | 'KeyR' | 'KeyP' | 'KeyF'

    //The elements of the game
    type ViewType = 'leftpaddle' | 'rightpaddle' | 'ball' | 'blast'


    //Reusable obsrevable for keyboard events
    const keyObservable = <T>(eventName: Event, k:Key, result: () => T) => 
      fromEvent<KeyboardEvent>(document, eventName)
      .pipe(
        filter(({code}) => code === k),
        filter(({repeat}) => !repeat),
        map(result)
      )

    //Reusable observable for mouse events 
    const mouseObservable = <T>(eventName: Event, obj: any, result: (arg: any) => T) =>
      fromEvent<MouseEvent>(obj, eventName).pipe(
        map(result)
      )

    /**
     * This part of the code deals with the Vector physics of the game
     */

    //Movement action streams
    const
      moveUp = keyObservable('keydown', 'ArrowUp', () => new Move(Vec.unitVecInDirection(0))),
      stopMoveUp = keyObservable('keyup', 'ArrowUp', () => new Move(Vec.Zero)),
      moveDown = keyObservable('keydown', 'ArrowDown', () => new Move(Vec.unitVecInDirection(180))),
      stopMoveDown = keyObservable('keyup', 'ArrowDown', () => new Move(Vec.Zero)),
      blast = keyObservable('keydown', 'KeyF', () => new Blast(1));
    
    //Game options steams
    const 
        pause = keyObservable("keydown", 'KeyP', () => new Pause()),
        restart = keyObservable("keydown", 'KeyR', () => new Restart());
    
    //Action streams
    const 
        click = mouseObservable('mousedown', canvas, ({clientX, clientY}) => new Click(clientX, clientY)),
        mouseleave = mouseObservable("mouseleave", canvas, () => new MouseLeave()),
        mouseenter = mouseObservable("mouseenter", canvas, () => new MouseEnter());


    // Vector Maths returns new Vectors
    class Vec {
      constructor(public readonly x: number = 0, public readonly y: number = 0) {}
      add = (b:Vec) => new Vec(this.x + b.x, this.y + b.y)
      sub = (b:Vec) => this.add(b.scale(-1))
      len = ()=> Math.sqrt(this.x*this.x + this.y*this.y)
      scale = (s:number) => new Vec(this.x*s,this.y*s)
      ortho = ()=> new Vec(this.y,-this.x)
      rotate = (deg:number) =>
                (rad =>(
                    (cos,sin,{x,y})=>new Vec(x*cos - y*sin, x*sin + y*cos)
                  )(Math.cos(rad), Math.sin(rad), this)
                )(Math.PI * deg / 180)
      static unitVecInDirection = (deg: number) => new Vec(0,-1).rotate(deg)
      static Zero = new Vec();
    }

    //The following functions determine the reflected vector and is used for Velocity in state
    //Maths dot product and vector reflection using the normal
    const 
      vectorDot = (v:Vec) => (u:Vec) => v.x*u.x + v.y*u.y,
      //Gives the angle between two vectors formulae is cos(x) = (v1.v2)/|v1||v2|
      vectorAngle = (v1: Vec) => (v2: Vec) => Math.acos((vectorDot(v1)(v2)) / (v1.len()*v2.len())),
      //The formula is v - 2n(v(dot)n)
      vectorReflection = (normal:Vec) =>(v:Vec) => v.sub(normal.scale(vectorDot(v)(normal)).scale(2)),
      //Simply determines if vectors are equal
      vectorEquality = (v1:Vec) => (v2:Vec) => Math.abs(v1.x - v2.x) < Constants.Epsilon && Math.abs(v1.y - v2.y) < Constants.Epsilon,
      //Normalize the vector
      vectorNormalize = (v:Vec) => v.scale(1/v.len());

   const NormalVectors = new class {
     //The normals are default positive so vertical is for a left vertical and horizonal a top hortizonal
      readonly Vertical = new Vec(1, 0)
      readonly Horizonal = new Vec(0, 1)
    }

    //Use these functions to return the resultant vector from a bounce on these surfaces 
    //(written respect to bouncing on the inside of a box "| <-" == reflectLeft)
    const
      reflectLeft = vectorReflection(NormalVectors.Vertical),
      reflectRight = vectorReflection(NormalVectors.Vertical.scale(-1)),
      reflectTop = vectorReflection(NormalVectors.Horizonal),
      reflectBot = vectorReflection(NormalVectors.Horizonal.scale(-1))

    //These vectors represent the basic left right direction used to determine possession of blast or objects
    const
      isRightDirection = vectorEquality(NormalVectors.Vertical),
      isLeftDirection = vectorEquality(NormalVectors.Vertical.scale(-1))

    //Torpus wrap used for portal obstacles
    //Torpology wrapping - Teleports any vec doing out of the canvas : we will need to bounce back
    const torpusWrap = ({x, y}:Vec) => {
      const wrap = (v: number) =>
        v < 0 ? v + Constants.CanvasSize : v > Constants.CanvasSize  ? v - Constants.CanvasSize  : v;  //Change the condition to change direction
      return new Vec(wrap(x), wrap(y));
    }


    /**
     * Defining the types involced in this game
     */

    type CollisionType = 'paddle' | 'wall' | 'teleporter'
    type shape = "rectangle" | "circle"

    type Body = Readonly<{
      id: string,
      pos: Vec,
      vel: Vec, //Contains the direction vector
      thrust: boolean,
      direction: Vec, //Direction of movement
      shape: Shape,
      angle: number,
      rotation: number,
      torque: number,
      createTime: number
    }>
    

    type Shape = Readonly <{
      shape: shape,
      radius: number,
      height: number,
      width: number
    }>

    type State = Readonly<{
      time: number, 
      ball: Body,
      blasts: ReadonlyArray<Body>,
      exit: ReadonlyArray<Body>,
      leftpaddle: Body,
      chargep1: number,
      rightpaddle: Body,
      chargep2: number,
      objCount: number, //Creates a way to ID an objects by incrementing counter
      round: number,
      leftscore: number,
      rightscore: number,
      restart: number, //Enables clean up stg 1 and stg 2
      clearDisplay: boolean,
      pause: boolean,
      gameOver: boolean
    }>

    //This part of the code is for creating the objects in the game
    function createBall(angle:number, delay:number): Body {
      const pos = new Vec(Constants.BallX, Constants.BallY);
      return {
        id: `ball`,
        pos: pos,
        vel: Vec.unitVecInDirection(angle).scale(Constants.BallMinimumVelocity),
        createTime: delay,
        shape: <Shape> {
          shape: "rectangle",
          height: Constants.BallHeight,
          width: Constants.BallWidth
        },
        direction: Vec.Zero,
        thrust: false,
        angle: angle,
        rotation: 0,
        torque: 0,
      }
    }

    function createPaddle(v: ViewType): Body {
      if (v === 'ball') {
        console.log("Incorrect viewtype in createPaddle <ball>")
      }
      //Determines the position which is displayed on the screen
      const position = v === 'leftpaddle' ? new Vec(Constants.DefaultLeftPaddle[0], Constants.DefaultLeftPaddle[1])
        : new Vec(Constants.DefaultRightPaddle[0], Constants.DefaultRightPaddle[1]);
      return {
        id: v,
        pos: position,
        shape: <Shape> {
          shape: "rectangle",
          radius: 0,
          height: Constants.PaddleHeight,
          width: Constants.PaddleWidth
        },
        vel: Vec.Zero,
        createTime: 0,
        thrust: false,
        direction: Vec.Zero,
        angle: 0,
        rotation: 0,
        torque: 0,
      }
    }

    const initialState: State = {
      time: 0,
      round: 0,
      ball: createBall(Constants.StartBallDirection, 0),
      leftpaddle: createPaddle('leftpaddle'),
      chargep1: 5,
      rightpaddle: createPaddle('rightpaddle'),
      chargep2: 5,
      leftscore: 0,
      rightscore: 0,
      blasts: [],
      exit: [],
      restart: 0,
      objCount: 0,
      clearDisplay: false,
      pause: true,
      gameOver: false
    }

    const 
    leftWall = <Body>{
      id: `leftScore`,
      pos: new Vec(0, 0),
      vel: Vec.Zero,
      createTime: 0,
      shape: <Shape> {
        shape: "rectangle",
        radius: 0,
        height: Constants.CanvasSize,
        width: Constants.ScoreWidth
      },
      direction: Vec.Zero,
      thrust: false,
      angle: 0,
      rotation: 0,
      torque: 0,
    },
    rightWall = <Body>{
      id: `rightScore`,
      pos: new Vec(Constants.CanvasSize - Constants.ScoreWidth, 0),
      vel: Vec.Zero,
      createTime: 0,
      shape: <Shape> {
        shape: "rectangle",
        radius: 0,
        height: Constants.CanvasSize,
        width: Constants.ScoreWidth
      },
      direction: Vec.Zero,
      thrust: false,
      angle: 0,
      rotation: 0,
      torque: 0,
    }

    const createCircle = (viewType: ViewType) => (oid: number) => 
    (time: number) => (radius: number) => (pos: Vec) => (vel: Vec) => <Body>{
      id: viewType + oid.toString(),
      pos: pos.add(vel.scale(5)), //Position refers to the centre
      vel: vel, //Contains the direction vector
      thrust: false,
      direction: vectorNormalize(vel), 
      shape: <Shape> {
        shape: 'circle',
        radius: radius,
        width: radius*2
        },
      angle: 0,
      rotation: 0,
      torque: 0,
      createTime: time
    }


    /**
     * This part handles interactions within the game
     */

    /**
     * Checks if the ball collided with a rectangular region- If overlap then bounce 
     * this is done by centering the vector and measuring the distance from the centre
     * @param a Another object
     * @param ball The ball
     */
    const centreRectangle = (xa: Body) => xa.pos.add(new Vec(xa.shape.width/2, xa.shape.height/2))
    const hasCollided = (a:Body) => (b:Body) => {
      const 
        centrea = a.shape.shape === 'rectangle' ? centreRectangle(a) : a.pos,
        centreb = b.shape.shape === 'rectangle' ? centreRectangle(b) : b.pos;

      //This finds the centre of the rectangles, then calculates the difference between x and y
      const dxy = centrea.sub(centreb);
      return Math.abs(dxy.x) > (a.shape.width + b.shape.width)/2 ? false 
      : Math.abs(dxy.y) > (a.shape.height + b.shape.height)/2 ? false
      : true
    }
    /**
     * handleCollisions handles any collision with the ball and obstacles with objects
     * Obstacles define their area
     * @param s State of the game
     * @param o The ball 
     */
    const handleCollisions = (s: State, o:Body) => {
      //Handles any collision with the top or bottom or side returns the resulting vector
      //There is some transfer direction of the velocity but a bounce should reduce the velocity by a half
      const resultantVelocityUnscaled = o.pos.y < 0 ? reflectBot(o.vel) 
      : o.pos.y + o.shape.height > Constants.CanvasSize ? reflectTop(o.vel)
      : hasCollided(s.leftpaddle)(o) ? 
        reflectLeft(o.vel).add(s.leftpaddle.vel.scale(Constants.VelocityTransferEfficiency)).scale(Constants.VelocityReflectEfficiency).len() < Constants.BallMinimumVelocity ? 
        vectorNormalize(reflectLeft(o.vel).add(s.leftpaddle.vel)).scale(Constants.BallMinimumVelocity)
        : reflectLeft(o.vel).add(s.leftpaddle.vel.scale(Constants.VelocityTransferEfficiency)).scale(Constants.VelocityReflectEfficiency)
      : hasCollided(s.rightpaddle)(o) ? reflectRight(o.vel).add(s.leftpaddle.vel.scale(Constants.VelocityTransferEfficiency)).scale(Constants.VelocityReflectEfficiency).len() < Constants.BallMinimumVelocity ? 
        vectorNormalize(reflectRight(o.vel).add(s.leftpaddle.vel)).scale(Constants.BallMinimumVelocity)
        : reflectRight(o.vel).add(s.leftpaddle.vel.scale(Constants.VelocityTransferEfficiency)).scale(Constants.VelocityReflectEfficiency)
      : o.vel 
    
      const locationMultiplier = (v: Vec) => {
        return hasCollided(s.rightpaddle)(o) ? 
          Math.abs(centreRectangle(s.rightpaddle).sub(centreRectangle(o)).y) > s.rightpaddle.shape.height/Constants.EdgeLocationPortion ?
            v.scale((Math.abs(centreRectangle(s.rightpaddle).sub(centreRectangle(o)).y)/((s.rightpaddle.shape.height + o.shape.height)/Constants.EdgeLocationPortion)) *Constants.EdgeMultiplier)
            : v 
          : hasCollided(s.leftpaddle)(o) ? 
            Math.abs(centreRectangle(s.leftpaddle).sub(centreRectangle(o)).y) > s.leftpaddle.shape.height/Constants.EdgeLocationPortion ?
          v.scale((Math.abs(centreRectangle(s.leftpaddle).sub(centreRectangle(o)).y)/((s.leftpaddle.shape.height + o.shape.height)/Constants.EdgeLocationPortion)) *Constants.EdgeMultiplier) 
          : v
        : v
      }

      const resultantVelocity = locationMultiplier(resultantVelocityUnscaled);
    /**
     * bounce similar to torpus returns the ball back into the map maintaining the correct reflection
     * @param pos The position of the ball
     * @param deg The current angle the ball is heading
     */
    const bounce = (pos: Vec) => (vel:Vec) => {
      //This calculates how much scale add the vector to ensure we are ouside of the border
      const k = pos.y < 0 ? Math.ceil(Math.abs(pos.y)/Math.abs(vel.y)) 
      : pos.y > Constants.CanvasSize ? Math.ceil((pos.y - Constants.CanvasSize)/Math.abs(vel.y))
      : hasCollided(s.leftpaddle)(o) ? Math.ceil((o.pos.sub(s.leftpaddle.pos)).x/Math.abs(vel.x))
      : hasCollided(s.rightpaddle)(o) ? Math.ceil(((o.pos.sub(s.rightpaddle.pos)).x + Constants.PaddleWidth)/Math.abs(vel.x))
      : 1
      return new Vec(pos.x+k*vel.x, pos.y+k*vel.y)
      }
      return [bounce(o.pos)(resultantVelocity), resultantVelocity]
    }

    // const handleMouseMovement = (s: State, x: number, y: number) => {}e instanceof MouseMove ? handleMouseMovement(s, e.x, e.y) 
    /**
     * This function moves the object by the velocity, it also handles any collisions which result in a change of velocity
     * Or bounce, also if it collids with the end we change score
     * @param s The current state
     * @param o The object to move
     */
    const moveObj = (s: State, o: Body) => {
      const [p, resultantVelocity] = handleCollisions(s, o);
      return <Body>{...o,
      angle: o.angle + vectorAngle(o.vel)(resultantVelocity),
      pos: p,
      vel: resultantVelocity
    }
  }

  const moveBlast = (o: Body) => {
    return {...o,
    pos: o.pos.x > Constants.CanvasSize + Constants.BlastMaxSize ? o.pos : o.pos.add(o.vel)}
  }

  /**
   * Moves the paddle applying velocity and acceleration also drops movement to 0 upon keyup
   * @param o The paddle
   */
  const movePaddle = (o : Body, direction:Vec) => {
    const isZero = vectorEquality(Vec.Zero)(o.vel)
    return direction.y === 1 ? {...o, 
      pos: o.pos.y > Constants.CanvasSize - 1 ? o.pos :o.pos.add(new Vec(0, 1).scale(isZero ? Constants.PaddleStartVelocity  : o.vel.len())),
      vel: isZero ? new Vec(0, 1).scale(Constants.PaddleStartVelocity) : o.vel.scale(Constants.PaddleAcceleration)} :
    direction.y === -1 ? {...o, 
      pos: o.pos.y < -o.shape.height + 1 ? o.pos : o.pos.add(new Vec(0, -1).scale(isZero ? Constants.PaddleStartVelocity  :o.vel.len())),
      vel: isZero ? new Vec(0, -1).scale(Constants.PaddleStartVelocity) : o.vel.scale(Constants.PaddleAcceleration)} : 
    {...o,
    vel: Vec.Zero}
  }

  /**
   * moveAiPaddle perfectly tracks the ball as we expect in the specificaiton
   * @param rightpaddle  The Ai paddle
   * @param ball The ball body
   */
  const moveAiPaddle = (rightpaddle: Body, ball: Body) =>
    <Body>{...rightpaddle,
     pos: new Vec(rightpaddle.pos.x, ball.pos.y - Constants.PaddleHeight/2)}
  
  /**
  * fireBlast Creates a body representing a circle also the position is the centre of the circle
  * @param s The state of the game
  * @param x The number represents either the player or enemy blast
  */
  const fireBlast = (s: State, x: number) => {
    return x === 1? {...s,
    blasts: s.chargep1 > Constants.MinimumCharge ? s.blasts.concat(createCircle('blast')(s.objCount+1)(s.time)(s.chargep1*Constants.BlastSizeRate)
      (centreRectangle(s.leftpaddle))(Vec.unitVecInDirection(90).scale(s.chargep1/Constants.BlastMass)))
      : s.blasts,
    objCount: s.chargep1 > Constants.MinimumCharge ? s.objCount + 1 : s.objCount,
    chargep1: Constants.StartingCharge
  }
    : {...s, 
      blasts: s.chargep2 > Constants.MinimumCharge ? s.blasts.concat(createCircle('blast')(s.objCount+1)(s.time)(s.chargep2*Constants.BlastSizeRate)
      (centreRectangle(s.rightpaddle))(Vec.unitVecInDirection(270).scale(s.chargep2/Constants.BlastMass)))
      : s.blasts,
      objCount: s.chargep2 > Constants.MinimumCharge ? s.objCount + 1 : s.objCount,
      chargep2: Constants.StartingCharge,
      time: s.time + 1
    }
  }

  /**
   * blastState gives either the exit or existing blast
   * @param blasts The current blast in play
   */
  const blastState = (blasts: ReadonlyArray<Body>, time:number) => (exitOrExist: 'exit' | 'exist') => {
    const
      expired = (o:Body) =>  time - o.createTime > Constants.BlastExpiry;
      // outOfMap = (o:Body) =>  hasCollided(leftWall)(o) || hasCollided(rightWall)(o);
    return exitOrExist === 'exit' ? blasts.filter((o: Body) => expired(o)) 
    : blasts.filter((o:Body) => !(expired(o)))
  }

  /**
   * tick maintains the constant tick of the game
   * @param s 
   * @param elapsed 
   */
  const tick = (s: State, elapsed: number) => {
    //Add a scoring in tick and reset
    const didScore = hasCollided(leftWall)(s.ball) ? 1 : hasCollided(rightWall)(s.ball) ? -1 : 0;
    //Automate firing blast for Ai
    if ((s.time+1) % (100/(s.blasts.length+1)) === 0) {
      return fireBlast(s, -1)
    }
    const blastDecide = blastState(s.blasts, s.time);
     return s.restart === 1 ? {...initialState,
        exit: s.blasts,
        restart: 2
        } : s.restart === 2 ? {...initialState,
          leftpaddle: s.leftpaddle,
          rightpaddle: s.rightpaddle,
          pause: false,
          ball: s.ball
        } :s.pause ? <State> {...s 
          } : !didScore ? <State>{...s,
          ball: elapsed > s.ball.createTime ? moveObj(s, s.ball) : s.ball,
          leftpaddle: movePaddle(s.leftpaddle, s.leftpaddle.direction),
          rightpaddle: moveAiPaddle(s.rightpaddle, s.ball),
          blasts: blastDecide('exist').map(moveBlast),
          exit: blastDecide('exit'),
          chargep1: s.chargep1 < Constants.MaximumCharge ? s.chargep1 + Constants.ChargeRate : s.chargep1,
          chargep2: s.chargep2 < Constants.MaximumCharge ? s.chargep2 + Constants.ChargeRate : s.chargep2,
          time: elapsed,
        } : didScore === 1 ? <State>{...s,
          ball: createBall(Constants.BallFireDirectionLeft, elapsed + Constants.RoundDelay),
          rightscore: s.rightscore + 1,
          time: elapsed,
          gameOver: s.rightscore + 1 > 6 ? true : false,
          pause: s.rightscore + 1 > 6 ? true : false,
          blasts: [],
          exit: s.blasts
        } : <State>{...s,
           ball: createBall(Constants.BallFireDirectionRight, elapsed + Constants.RoundDelay),
           leftscore: s.leftscore + 1,
           time: elapsed,
           gameOver: s.leftscore + 1 > 6 ? true : false,
           pause: s.leftscore + 1 > 6 ? true : false,
           blasts: [],
           exit: s.blasts
          }
  }


  /**
   * Handling overall state
   * @param s The current state of the game
   * @param e The class or action to pass through
   */
    const reduceState = (s: State, e: Action) => {
      return e instanceof MouseLeave ? {...s, pause: true }
      : e instanceof MouseEnter ? {...s, pause: false}
      : e instanceof Move ? {...s, 
      leftpaddle: {...s.leftpaddle,
      direction: e.direction}
      } : e instanceof Pause ? {...s,
      pause: !s.pause 
      } : e instanceof Restart ? {...s,
        restart: 1} 
      : e instanceof Click ? s
      : e instanceof Blast ? fireBlast(s, e.x) 
      : tick(s, e.elapsed);
    }


    const subscription = interval(10).pipe(
      map(elapsed=>new Tick(elapsed)),
      merge(mouseleave, mouseenter),
      merge(
        stopMoveDown, stopMoveUp, moveDown, moveUp),
      merge(restart, pause),
      merge(click, blast),
      scan(reduceState, initialState)
      ).subscribe(updateView);

    /**
     * View
     * User interface (HTML) communicates with the controller
     */

     const 
     transform = (e: Element) => (x: number) => (y:number) => 
     e.setAttribute('transform', `translate(${x}, ${y})`),
     lpaddleView = transform(leftpaddle),
     rpaddleView = transform(rightpaddle),
     ballView = transform(ball)
    
    const attr = (e:Element, o:any) => {for(const k in o) e.setAttribute(k, String(o[k]))}
    const createText = (o:any) => (text: string) => { 
      const newElement = document.createElementNS(canvas.namespaceURI, "text")
      attr(newElement, o)
      newElement.textContent = text
      return newElement
    }
    const removeText = (textid:string): void => {
      const a = document.getElementById(textid);
      if (a) {
        canvas.removeChild(a);
      }
    }

    /**
     * UpdateBodyView places a blast into the canvas at its position
     * @param o Object
     */
    const updateBodyView =(canvas: Element) => (o: Body) => {
      const createBlastView = () => {
        const newBlast = document.createElementNS(canvas.namespaceURI, 'circle');
        attr(newBlast, {cx: o.pos.x, cy:o.pos.y, r:o.shape.radius, id:o.id, class: isRightDirection(o.direction) ? "playerBlast" : "oppBlast"});
        canvas.appendChild(newBlast);
        return newBlast
      }
      const blast = document.getElementById(o.id) || createBlastView();
      attr(blast, {cx: o.pos.x.toString(), cy: o.pos.y.toString()})
    }
    /**
     * UpdateView is the functio to update the entire view the mega view
     * @param s State of the game
     */
    function updateView(s: State) {
      s.blasts.forEach(updateBodyView(canvas));
      s.exit.forEach( o => {
        const v = document.getElementById(o.id);
        if (v) canvas.removeChild(v);
      })
      scoreplayer1.innerHTML = s.leftscore.toString();
      scoreplayer2.innerHTML = s.rightscore.toString();
      rpaddleView(s.rightpaddle.pos.x)(s.rightpaddle.pos.y)
      lpaddleView(s.leftpaddle.pos.x)(s.leftpaddle.pos.y)
      ballView(s.ball.pos.x)(s.ball.pos.y)
      if (s.gameOver) {
        if (!document.getElementById("gameover")) {
          const winner  = s.leftscore > s.rightscore ? "BUT YOU WIN!" : "AND YOU LOSE!";
          canvas.appendChild(createText({x:Constants.CanvasSize/6, y:Constants.CanvasSize/4, class:"gameover", id:"gameover"})("Game Over"));
          canvas.appendChild(createText({x:Constants.CanvasSize/1.5, y:Constants.CanvasSize/3, class:"winner", id:"winner"})(winner));
          canvas.appendChild(createText({x:Constants.CanvasSize/4, y:Constants.CanvasSize/2, class:"restart", id:"restart"})("Press R for restart"));
        }
      } else {
        removeText('gameover');
        removeText('restart')
        removeText('winner')
      }

    }
  }

  function menu() {
  }

  // the following simply runs your pong function on window load.  Make sure to leave it in place.
  if (typeof window != 'undefined')
    window.onload = ()=>{
      pong();
    }
  

