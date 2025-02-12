(function() {
  var canvas = document.getElementById("js-artboard");
  var ctx = canvas.getContext("2d");
  var canvas_height = canvas.height;
  var circle_radius = 5;
  var points = [
    new Point(circle_radius + 5, canvas_height - circle_radius - 5)
  ];
  var point, previous_point, next_point, px, animation_frame_id;
  var blue_shade = "#3A4B5F";
  var orange_shade = "#DC7828";
  var line_color = orange_shade;
  var dot_color = orange_shade;

  for (var i = 1; i <= 3; i++) {
    previous_point = points[i - 1];
    px = previous_point.x + 30;

    if (i % 2 === 0) {
      point = new Point(px, previous_point.y + 30);
    } else {
      point = new Point(px, previous_point.y - 30);
    }

    points.push(point);
  }

  points[2].y -= 5;
  points[3].y -= 5;
  points[3].x += 5;

  function Point(x, y) {
    this.x = x;
    this.y = y;
  }

  function drawCircle(x, y) {
    var canvas_height = 100;

    ctx.beginPath();
    ctx.arc(x, y, circle_radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = dot_color;
    ctx.fill();
    ctx.lineWidth = 0;
    ctx.strokeStyle = dot_color;
    ctx.stroke();
  }

  function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = line_color;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function reset() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  var idx = 0,
    offset = 0.01;

  function animate() {
    if (!document.getElementById("js-artboard")) {
      cancelAnimationFrame(animation_frame_id);

      return;
    }

    reset();

    for (var i = 0; i <= idx; i++) {
      point = points[i];
      next_point = points[i + 1];
      drawCircle(point.x, point.y);
      if (next_point) {
        drawCircle(next_point.x, next_point.y);
      }

      if (next_point) {
        if (i === idx) {
          drawLine(
            point.x,
            point.y,
            point.x + (next_point.x - point.x) * offset,
            point.y + (next_point.y - point.y) * offset
          );
        } else {
          drawLine(point.x, point.y, next_point.x, next_point.y);
        }
      }

      // This is to paint one more layer of circles on top of the connecting line
      drawCircle(point.x, point.y);
      if (next_point) {
        drawCircle(next_point.x, next_point.y);
      }

    }
    offset += 0.05;
    if (offset >= 1) {
      idx++;
      offset = 0.05;

      if (idx === 4) {
        idx = 0;
      }
    }
    animation_frame_id = requestAnimationFrame(animate);
  }

  animation_frame_id = requestAnimationFrame(animate);
})();
