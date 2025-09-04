// PongGame.js
import React, { useEffect, useRef, useState } from "react";

const WIN_SCORE = 5;

export default function PongGame() {
  const [screen, setScreen] = useState("start");
  const [canvasSize, setCanvasSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight * 0.8,
  });

  // Calcula tamaños en cada render
  const paddleWidth = Math.max(canvasSize.width * 0.2, 60);
  const paddleHeight = Math.max(canvasSize.height * 0.015, 10);
  const ballRadius = Math.max(canvasSize.width * 0.025, 8);

  const [isPaused, setIsPaused] = useState(false);
  const [playerPaddleX, setPlayerPaddleX] = useState(canvasSize.width / 2 - paddleWidth / 2);
  const [aiPaddleX, setAiPaddleX] = useState(canvasSize.width / 2 - paddleWidth / 2);
  const [ball, setBall] = useState({
    x: canvasSize.width / 2,
    y: canvasSize.height / 2,
    vx: 2,
    vy: 1.5,
  });
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [result, setResult] = useState(""); // "win" o "lose"

  const rafRef = useRef(null);
  const playerXRef = useRef(playerPaddleX);
  const aiXRef = useRef(aiPaddleX);
  const ballRef = useRef(ball);

  useEffect(() => { playerXRef.current = playerPaddleX; }, [playerPaddleX]);
  useEffect(() => { aiXRef.current = aiPaddleX; }, [aiPaddleX]);
  useEffect(() => { ballRef.current = ball; }, [ball]);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 600;
      const newWidth = isMobile ? window.innerWidth : Math.min(window.innerWidth * 0.95, 420);
      const newHeight = isMobile ? window.innerHeight * 0.8 : Math.min(window.innerHeight * 0.7, 600);
      setCanvasSize({
        width: newWidth,
        height: newHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (screen !== "game") return;
    const step = () => {
      if (!isPaused) {
        let { x, y, vx, vy } = ballRef.current;
        const W = canvasSize.width;
        const H = canvasSize.height;

        x += vx;
        y += vy;

        // Rebote en los laterales
        if (x - ballRadius < 0 || x + ballRadius > W) vx *= -1;

        // IA sigue la bola (pala superior)
        const aiCenter = aiXRef.current + paddleWidth / 2;
        if (aiCenter < x - 20) aiXRef.current = Math.min(W - paddleWidth, aiXRef.current + 4);
        else if (aiCenter > x + 20) aiXRef.current = Math.max(0, aiXRef.current - 4);

        // Colisión con pala superior (IA)
        if (y - ballRadius < paddleHeight) {
          if (x > aiXRef.current && x < aiXRef.current + paddleWidth) {
            vy *= -1;
            y = paddleHeight + ballRadius;
          }
        }
        // Colisión con pala inferior (jugador)
        if (y + ballRadius > H - paddleHeight) {
          if (x > playerXRef.current && x < playerXRef.current + paddleWidth) {
            vy *= -1;
            y = H - paddleHeight - ballRadius;
          }
        }

        // Punto para IA
        if (y + ballRadius > H) {
          setScore((s) => {
            const newScore = { ...s, ai: s.ai + 1 };
            if (newScore.ai >= WIN_SCORE) {
              setResult("lose");
              setScreen("end");
            }
            return newScore;
          });
          x = W / 2; y = H / 2; vx = 2;
        }
        // Punto para jugador
        else if (y - ballRadius < 0) {
          setScore((s) => {
            const newScore = { ...s, player: s.player + 1 };
            if (newScore.player >= WIN_SCORE) {
              setResult("win");
              setScreen("end");
            }
            return newScore;
          });
          x = W / 2; y = H / 2; vx = 2;
        }

        ballRef.current = { x, y, vx, vy };
        setBall(ballRef.current);
        setAiPaddleX(aiXRef.current);
        setPlayerPaddleX(playerXRef.current);
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPaused, canvasSize.width, canvasSize.height, screen]);

  // Movimiento solo por botones
  const movePlayer = (delta) => {
    setPlayerPaddleX((x) => {
      const W = canvasSize.width;
      const nx = Math.max(0, Math.min(W - paddleWidth, x + delta));
      playerXRef.current = nx;
      return nx;
    });
  };

  const startGame = () => {
    setScore({ player: 0, ai: 0 });
    setPlayerPaddleX(canvasSize.width / 2 - paddleWidth / 2);
    setAiPaddleX(canvasSize.width / 2 - paddleWidth / 2);
    setBall({
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
      vx: 2,
      vy: 1.5,
    });
    setIsPaused(false);
    setScreen("game");
    setResult("");
  };

  const restartGame = () => {
    startGame();
  };

  // Pantalla de inicio
  if (screen === "start") {
    return (
      <div style={styles.container}>
        <h1 style={{ color: "#00ff99", fontSize: 48, marginBottom: 40 }}>PONG</h1>
        <button style={styles.button} onClick={startGame}>
          Iniciar juego
        </button>
        <div style={{ color: "#fff", marginTop: 40, fontSize: 20 }}>
          Primer jugador en llegar a {WIN_SCORE} puntos gana.
        </div>
      </div>
    );
  }

  // Pantalla de fin de partida
  if (screen === "end") {
    return (
      <div style={styles.container}>
        <h1 style={{ color: result === "win" ? "#00ff99" : "#ff0055", fontSize: 48, marginBottom: 40 }}>
          {result === "win" ? "¡Ganaste!" : "¡Perdiste!"}
        </h1>
        <div style={{ color: "#fff", fontSize: 28, marginBottom: 20 }}>
          Marcador final: <span style={{ color: "#00ff99" }}>{score.player}</span> - <span style={{ color: "#ff0055" }}>{score.ai}</span>
        </div>
        <button style={styles.button} onClick={restartGame}>
          Reiniciar partida
        </button>
      </div>
    );
  }

  // Pantalla de juego
  return (
    <div style={styles.container}>
      <div style={styles.gameWrapper}>
        <svg
          width={canvasSize.width}
          height={canvasSize.height}
          style={styles.canvas}
        >
          {/* Pala IA (arriba) */}
          <rect x={aiPaddleX} y={0} width={paddleWidth} height={paddleHeight} fill="#ff0055" />
          {/* Pala jugador (abajo) */}
          <rect x={playerPaddleX} y={canvasSize.height - paddleHeight} width={paddleWidth} height={paddleHeight} fill="#00ff99" />
          {/* Bola */}
          <circle cx={ball.x} cy={ball.y} r={ballRadius} fill="white" />
        </svg>

        <div style={styles.scoreBoard}>
          <span style={styles.score}>{score.player}</span>
          <span style={styles.score}>{score.ai}</span>
        </div>

        <button style={styles.button} onClick={() => setIsPaused((p) => !p)}>
          {isPaused ? "▶ Play" : "⏸ Pause"}
        </button>

        <div style={styles.controls}>
          <button style={{ ...styles.controlBtn, marginRight: 15 }} onClick={() => movePlayer(-canvasSize.width * 0.15)}>
            ⬅
          </button>
          <button style={{ ...styles.controlBtn, marginLeft: 15 }} onClick={() => movePlayer(canvasSize.width * 0.15)}>
            ➡
          </button>
        </div>
        <div style={{ color: "#aaa", fontSize: 14, marginTop: 10, textAlign: "center" }}>
          Usa los botones para mover la pala.
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0d0d0f",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: "100vw",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  gameWrapper: {
    width: "100vw",
    maxWidth: "100vw",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  canvas: {
    border: "4px solid #00ff99",
    borderRadius: 12,
    backgroundColor: "black",
    marginTop: 20,
    width: "100vw",
    height: "auto",
    maxWidth: "100vw",
    maxHeight: "80vh",
    boxSizing: "border-box",
    touchAction: "none",
    display: "block",
  },
  scoreBoard: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90vw",
    marginTop: 10,
    fontSize: "clamp(18px, 5vw, 28px)",
  },
  score: {
    color: "white",
    fontWeight: "bold",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#00ff99",
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    boxShadow: "0 5px 10px #00ff9980",
    color: "#0d0d0f",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "clamp(16px, 4vw, 18px)",
    width: "90vw",
    maxWidth: 250,
  },
  controlBtn: {
    backgroundColor: "#00ff99",
    padding: "clamp(10px, 4vw, 15px)",
    borderRadius: 50,
    border: "none",
    color: "#0d0d0f",
    fontWeight: "bold",
    fontSize: "clamp(18px, 5vw, 22px)",
    cursor: "pointer",
    minWidth: 50,
  },
  controls: {
    display: "flex",
    flexDirection: "row",
    marginTop: 30,
    width: "90vw",
    justifyContent: "center",
    gap: 10,
  },
};