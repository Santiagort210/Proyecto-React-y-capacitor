// PongGame.js
import React, { useEffect, useRef, useState } from "react";

export default function PongGame() {
  // Pantalla de inicio y estado de fin de partida
  const [screen, setScreen] = useState("start"); // "start" | "game" | "end"
  const [winner, setWinner] = useState(null); // "player" | "ai" | null

  // Usar el tamaño de la ventana para el canvas
  const [canvasSize, setCanvasSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight * 0.6,
  });

  const paddleHeight = 80;
  const paddleWidth = 10;
  const ballRadius = 8;

  const [isPaused, setIsPaused] = useState(false);
  const [playerPaddleY, setPlayerPaddleY] = useState(canvasSize.height / 2 - paddleHeight / 2);
  const [aiPaddleY, setAiPaddleY] = useState(canvasSize.height / 2 - paddleHeight / 2);
  const [ball, setBall] = useState({
    x: canvasSize.width / 2,
    y: canvasSize.height / 2,
    vx: 4,
    vy: 3,
  });
  const [score, setScore] = useState({ player: 0, ai: 0 });

  const rafRef = useRef(null);
  const playerYRef = useRef(playerPaddleY);
  const aiYRef = useRef(aiPaddleY);
  const ballRef = useRef(ball);
  const canvasRef = useRef(null);

  useEffect(() => { playerYRef.current = playerPaddleY; }, [playerPaddleY]);
  useEffect(() => { aiYRef.current = aiPaddleY; }, [aiPaddleY]);
  useEffect(() => { ballRef.current = ball; }, [ball]);

  // Actualizar tamaño al cambiar ventana
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight * 0.6,
      });
      const middleY = window.innerHeight * 0.3;
      setPlayerPaddleY(Math.max(0, Math.min(middleY - paddleHeight / 2, window.innerHeight * 0.6 - paddleHeight)));
      setAiPaddleY(Math.max(0, Math.min(middleY - paddleHeight / 2, window.innerHeight * 0.6 - paddleHeight)));
      setBall({ x: window.innerWidth / 2, y: window.innerHeight * 0.3, vx: 4, vy: 3 });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line
  }, []);

  // Game loop
  useEffect(() => {
    if (screen !== "game") return;
    if (score.player >= 10 || score.ai >= 10) {
      setWinner(score.player >= 10 ? "player" : "ai");
      setScreen("end");
      return;
    }
    const step = () => {
      if (!isPaused) {
        let { x, y, vx, vy } = ballRef.current;
        const H = canvasSize.height;
        const W = canvasSize.width;

        // Update ball
        x += vx;
        y += vy;

        // Bounce top/bottom
        if (y - ballRadius < 0 || y + ballRadius > H) vy *= -1;

        // AI follow
        const aiCenter = aiYRef.current + paddleHeight / 2;
        if (aiCenter < y - 35) aiYRef.current = Math.min(H - paddleHeight, aiYRef.current + 4);
        else if (aiCenter > y + 35) aiYRef.current = Math.max(0, aiYRef.current - 4);

        // Collisions with paddles
        if (x - ballRadius < 20) {
          // Left paddle
          if (y > playerYRef.current && y < playerYRef.current + paddleHeight) {
            vx *= -1;
            x = 20 + ballRadius;
          }
        }
        if (x + ballRadius > W - 20) {
          // Right paddle
          if (y > aiYRef.current && y < aiYRef.current + paddleHeight) {
            vx *= -1;
            x = W - 20 - ballRadius;
          }
        }

        // Scoring
        if (x - ballRadius < 0) {
          setScore((s) => ({ ...s, ai: s.ai + 1 }));
          x = W / 2; y = H / 2; vx = -4;
        } else if (x + ballRadius > W) {
          setScore((s) => ({ ...s, player: s.player + 1 }));
          x = W / 2; y = H / 2; vx = 4;
        }

        ballRef.current = { x, y, vx, vy };
        setBall(ballRef.current);
        setAiPaddleY(aiYRef.current);
        setPlayerPaddleY(playerYRef.current);
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line
  }, [isPaused, canvasSize.width, canvasSize.height, screen, score.player, score.ai]);

  // Dibuja el juego en el canvas
  useEffect(() => {
    if (screen !== "game") return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Fondo
    ctx.fillStyle = "#0d0d0f";
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Bordes
    ctx.strokeStyle = "#00ff99";
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, canvasSize.width, canvasSize.height);

    // Palas
    ctx.fillStyle = "white";
    ctx.fillRect(10, playerPaddleY, paddleWidth, paddleHeight);
    ctx.fillRect(canvasSize.width - 20, aiPaddleY, paddleWidth, paddleHeight);

    // Pelota
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Marcador
    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(score.player, canvasSize.width / 2 - 40, 40);
    ctx.fillText(score.ai, canvasSize.width / 2 + 40, 40);
  }, [playerPaddleY, aiPaddleY, ball, canvasSize, score, screen]);

  // Helpers para mover la pala del jugador
  const movePlayer = (delta) => {
    setPlayerPaddleY((y) => {
      const H = canvasSize.height;
      const ny = Math.max(0, Math.min(H - paddleHeight, y + delta));
      playerYRef.current = ny;
      return ny;
    });
  };

  // Iniciar juego
  const startGame = () => {
    setScore({ player: 0, ai: 0 });
    setPlayerPaddleY(canvasSize.height / 2 - paddleHeight / 2);
    setAiPaddleY(canvasSize.height / 2 - paddleHeight / 2);
    setBall({
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
      vx: 4,
      vy: 3,
    });
    setIsPaused(false);
    setWinner(null);
    setScreen("game");
  };

  // Volver a pantalla de inicio
  const goToStart = () => {
    setScreen("start");
    setWinner(null);
  };

  // Pantalla de inicio
  if (screen === "start") {
    return (
      <div style={styles.container}>
        <h1 style={{ color: "#00ff99", fontSize: 48, marginBottom: 16, textShadow: "0 0 10px #00ff99" }}>
          Pong Game
        </h1>
        <p style={{ color: "white", fontSize: 22, marginBottom: 32 }}>
          ¡Bienvenido! Presiona el botón para comenzar.
        </p>
        <button style={styles.button} onClick={startGame}>
          Iniciar Juego
        </button>
      </div>
    );
  }

  // Pantalla de fin de partida
  if (screen === "end") {
    return (
      <div style={styles.container}>
        <h1 style={{ color: "#00ff99", fontSize: 48, marginBottom: 16, textShadow: "0 0 10px #00ff99" }}>
          {winner === "player" ? "¡Ganaste!" : "Perdiste"}
        </h1>
        <p style={{ color: "white", fontSize: 22, marginBottom: 32 }}>
          Marcador final: {score.player} - {score.ai}
        </p>
        <button style={styles.button} onClick={startGame}>
          Jugar de nuevo
        </button>
        <button style={{ ...styles.button, marginTop: 12, background: "#222", color: "#00ff99" }} onClick={goToStart}>
          Volver al inicio
        </button>
      </div>
    );
  }

  // Pantalla de juego
  return (
    <div style={styles.container}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={styles.canvas}
      />
      <div style={styles.scoreBoard}>
        <span style={styles.score}>{score.player}</span>
        <span style={styles.score}>{score.ai}</span>
      </div>
      <button style={styles.button} onClick={() => setIsPaused((p) => !p)}>
        {isPaused ? "▶️ Play" : "⏸️ Pause"}
      </button>
      <div style={styles.controls}>
        <button style={{ ...styles.controlBtn, marginRight: 15 }} onClick={() => movePlayer(-20)}>
          ⬆️
        </button>
        <button style={{ ...styles.controlBtn, marginLeft: 15 }} onClick={() => movePlayer(20)}>
          ⬇️
        </button>
      </div>
      <div style={{ color: "#00ff99", marginTop: 24, fontSize: 18 }}>
        Primer jugador en llegar a 10 puntos gana
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0d0d0f",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  canvas: {
    borderWidth: "4px",
    borderColor: "#00ff99",
    borderRadius: "12px",
    background: "black",
    boxShadow: "0 0 20px #00ff99",
    marginBottom: "10px",
    maxWidth: "100vw",
    maxHeight: "60vh",
    display: "block",
  },
  scoreBoard: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "120px",
    marginTop: "10px",
    marginBottom: "10px",
  },
  score: {
    color: "white",
    fontSize: "28px",
    fontWeight: "bold",
    width: "40px",
    textAlign: "center",
  },
  button: {
    marginTop: "10px",
    background: "#00ff99",
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    fontSize: "18px",
    fontWeight: "bold",
    color: "black",
    boxShadow: "0 5px 10px #00ff9977",
    cursor: "pointer",
  },
  controls: {
    display: "flex",
    flexDirection: "row",
    marginTop: "30px",
  },
  controlBtn: {
    background: "#00ff99",
    padding: "15px",
    borderRadius: "50%",
    border: "none",
    fontSize: "22px",
    color: "black",
    fontWeight: "bold",
    cursor: "pointer",
  },
};