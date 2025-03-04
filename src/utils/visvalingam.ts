// import type { Point, Points } from "./types";

// type Triangle = [Point, Point, Point];

type Point = number[];
type Points = Array<Point>;
type Triangle = Points & { previous?: Triangle, next?: Triangle };

const simplifyVisvalingam = function (points: Points, pointsToKeep: number) {


  let heap: any = minHeap();
  let maxArea = 0;
  let triangle: Triangle;
  let triangles: Triangle[] = [];

  const newPoints = points.map(function (d) {
    return d.slice(0, 2) as Point;
  });


  for (var i = 1, n = newPoints.length - 1; i < n; ++i) {
    triangle = newPoints.slice(i - 1, i + 2);
    if ((triangle[1][2] = area(triangle))) {
      triangles.push(triangle);
      heap.push(triangle);
    }
  }

  for (var i = 0, n = triangles.length as number; i < n; ++i) {
    triangle = triangles[i];
    triangle.previous = triangles[i - 1];
    triangle.next = triangles[i + 1];
  }

  while ((triangle = heap.pop())) {
    // If the area of the current point is less than that of the previous point
    // to be eliminated, use the latters area instead. This ensures that the
    // current point cannot be eliminated without eliminating previously-
    // eliminated points.
    if (triangle[1][2] < maxArea) triangle[1][2] = maxArea;
    else maxArea = triangle[1][2];

    if (triangle.previous) {
      triangle.previous.next = triangle.next;
      triangle.previous[2] = triangle[2];
      update(triangle.previous);
    } else {
      triangle[0][2] = triangle[1][2];
    }

    if (triangle.next) {
      triangle.next.previous = triangle.previous;
      triangle.next[0] = triangle[0];
      update(triangle.next);
    } else {
      triangle[2][2] = triangle[1][2];
    }
  }

  function update(triangle) {
    heap.remove(triangle);
    triangle[1][2] = area(triangle);
    heap.push(triangle);
  }

  var weights = newPoints.map(function (d) {
    return d.length < 3 ? Infinity : (d[2] += Math.random()); /* break ties */
  });
  weights.sort(function (a, b) {
    return b - a;
  });

  var result = newPoints.filter(function (d) {
    return d[2] > weights[pointsToKeep];
  });
  var end = new Date().getTime();
  // window.simplifyVisvalingam.stats[pointsToKeep] = end - start;
  return result;
};

//window.simplifyVisvalingam.stats = {};

function compare(a, b) {
  return a[1][2] - b[1][2];
}

function area(t: Triangle) {
  return Math.abs(
    (t[0][0] - t[2][0]) * (t[1][1] - t[0][1]) -
      (t[0][0] - t[1][0]) * (t[2][1] - t[0][1])
  );
}

function minHeap() {
  var heap: any = {},
    array: any = [];

  heap.push = function () {
    for (var i = 0, n = arguments.length; i < n; ++i) {
      var object = arguments[i];
      up((object.index = array.push(object) - 1));
    }
    return array.length;
  };

  heap.pop = function () {
    var removed = array[0],
      object = array.pop();
    if (array.length) {
      array[(object.index = 0)] = object;
      down(0);
    }
    return removed;
  };

  heap.size = function () {
    return array.length;
  };

  heap.remove = function (removed) {
    var i = removed.index,
      object = array.pop();
    if (i !== array.length) {
      array[(object.index = i)] = object;
      (compare(object, removed) < 0 ? up : down)(i);
    }
    return i;
  };

  function up(i) {
    var object = array[i];
    while (i > 0) {
      var up = ((i + 1) >> 1) - 1,
        parent = array[up];
      if (compare(object, parent) >= 0) break;
      array[(parent.index = i)] = parent;
      array[(object.index = i = up)] = object;
    }
  }

  function down(i) {
    var object = array[i];
    while (true) {
      var right = (i + 1) * 2,
        left = right - 1,
        down = i,
        child = array[down];
      if (left < array.length && compare(array[left], child) < 0)
        child = array[(down = left)];
      if (right < array.length && compare(array[right], child) < 0)
        child = array[(down = right)];
      if (down === i) break;
      array[(child.index = i)] = child;
      array[(object.index = i = down)] = object;
    }
  }

  return heap;
}

export { simplifyVisvalingam as simplify };
