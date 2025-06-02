let video;
let facemesh;
let handpose;
let facemeshPredictions = [];
let handposePredictions = [];
let gameStarted = false;
let question = '';
let answers = [];
let correctAnswer = '';
let showCheckmark = false;
let showCross = false;
let feedbackText = '';
let feedbackColor = '';
let feedbackTimeout = null;
let correctImage, wrongImage;

function preload() {
  // 載入圖片
  correctImage = loadImage('YY.png'); // 答對的圖片
  wrongImage = loadImage('X.png');   // 答錯的圖片
}

function setup() {
  createCanvas(640, 480).position(
    (windowWidth - 640) / 2,
    (windowHeight - 480) / 2
  );
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  // 初始化 Facemesh
  facemesh = ml5.facemesh(video, () => console.log('Facemesh model loaded'));
  facemesh.on('predict', results => {
    facemeshPredictions = results;
  });

  // 初始化 Handpose
  handpose = ml5.handpose(video, () => console.log('Handpose model loaded'));
  handpose.on('predict', results => {
    handposePredictions = results;
  });

  generateQuestion();
}

function draw() {
  push();
  translate(width, 0); // 移動到畫面右側
  scale(-1, 1);        // 水平鏡像
  image(video, 0, 0, width, height);
  pop();

  if (!gameStarted) {
    drawStartButton();
    checkStartButton();
  } else {
    drawGame();
  }

  if (feedbackText) {
    drawFeedback();
  }
}

function drawStartButton() {
  stroke(0); // 黑色邊框
  strokeWeight(4); // 邊框粗細
  fill(0); // 黑色底
  rect(width / 2 - 100, height / 2 - 50, 200, 100);

  fill(255); // 白色文字
  noStroke(); // 移除文字的邊框
  textSize(32);
  textAlign(CENTER, CENTER);
  text('開始', width / 2, height / 2);
}

function checkStartButton() {
  if (handposePredictions.length > 0) {
    const keypoints = handposePredictions[0].landmarks;
    const [x, y] = keypoints[8]; // 食指位置（Handpose 的點位）
    if (
      x > width / 2 - 100 &&
      x < width / 2 + 100 &&
      y > height / 2 - 50 &&
      y < height / 2 + 50
    ) {
      gameStarted = true;
    }
  }
}

function drawGame() {
  drawQuestionAndAnswers();

  if (handposePredictions.length > 0) {
    const keypoints = handposePredictions[0].landmarks;
    const [x, y] = keypoints[8]; // 食指位置（Handpose 的點位）
    noFill();
    stroke(0, 0, 255); // 藍色
    strokeWeight(4);
    ellipse(x, y, 50, 50); // 藍色圓圈

    checkAnswerSelection(x, y);
  }

  if (showCheckmark) {
    drawCheckmark();
  } else if (showCross) {
    drawCross();
  }
}

function drawQuestionAndAnswers() {
  // 題目框背景
  fill(0); // 黑色背景
  noStroke(); // 移除邊框
  rect(width / 2 - 150, 25, 300, 50); // 框框大小和位置

  // 題目文字
  fill(255); // 白色文字
  stroke(0); // 黑色邊框
  strokeWeight(2); // 邊框粗細
  textSize(32);
  textAlign(CENTER, CENTER);
  text(question, width / 2, 50);

  // 左邊答案框
  stroke(0); // 黑色邊框
  strokeWeight(4);
  fill(255); // 白色底
  rect(50, height / 2 - 50, 100, 100);

  // 右邊答案框
  stroke(0); // 黑色邊框
  strokeWeight(4);
  fill(255); // 白色底
  rect(width - 150, height / 2 - 50, 100, 100);

  // 答案文字
  noStroke(); // 移除文字邊框
  fill(0); // 黑色文字
  textSize(24);
  textAlign(CENTER, CENTER);
  text(answers[0], 100, height / 2);
  text(answers[1], width - 100, height / 2);
}

function checkAnswerSelection(x, y) {
  if (x > 50 && x < 150 && y > height / 2 - 50 && y < height / 2 + 50) {
    if (answers[0] === correctAnswer) {
      showCheckmark = true;
      feedbackText = '答對了';
      feedbackColor = 'green';
    } else {
      showCross = true;
      feedbackText = '答錯囉';
      feedbackColor = 'red';
    }
    handleFeedback();
  } else if (
    x > width - 150 &&
    x < width - 50 &&
    y > height / 2 - 50 &&
    y < height / 2 + 50
  ) {
    if (answers[1] === correctAnswer) {
      showCheckmark = true;
      feedbackText = '答對了';
      feedbackColor = 'green';
    } else {
      showCross = true;
      feedbackText = '答錯囉';
      feedbackColor = 'red';
    }
    handleFeedback();
  }
}

function handleFeedback() {
  clearTimeout(feedbackTimeout);
  feedbackTimeout = setTimeout(() => {
    showCheckmark = false;
    showCross = false;
    feedbackText = '';
    generateQuestion(); // 進入下一題
  }, 3000); // 持續 3 秒
}

function drawCheckmark() {
  if (facemeshPredictions.length > 0) {
    const keypoints = facemeshPredictions[0].scaledMesh;
    const [x, y] = keypoints[1]; // 鼻子位置（Facemesh 的點位）
    image(correctImage, x - 15, y - 15, 30, 30); // 顯示答對圖片
  }
}

function drawCross() {
  if (facemeshPredictions.length > 0) {
    const keypoints = facemeshPredictions[0].scaledMesh;
    const [x, y] = keypoints[1]; // 鼻子位置（Facemesh 的點位）
    image(wrongImage, x - 15, y - 15, 30, 30); // 顯示答錯圖片
  }
}

function drawFeedback() {
  stroke(0); // 黑色邊框
  strokeWeight(2); // 邊框粗細
  fill(feedbackColor); // 根據答對或答錯顯示顏色
  textSize(32);
  textAlign(CENTER, CENTER);
  text(feedbackText, width / 2, height / 2 - 100);
}

function generateQuestion() {
  const num1 = floor(random(1, 10));
  const num2 = floor(random(1, 10));
  question = `${num1} + ${num2} = ?`;
  correctAnswer = num1 + num2;

  let wrongAnswer;
  do {
    wrongAnswer = correctAnswer + floor(random(-3, 4));
  } while (wrongAnswer === correctAnswer); // 確保錯誤答案不與正確答案相同

  answers = random([true, false])
    ? [correctAnswer, wrongAnswer]
    : [wrongAnswer, correctAnswer];
}
