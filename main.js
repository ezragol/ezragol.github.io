const Aug = matrix([
    [3,4,1,0,2,0],
    [3,2,3,0,4,0],
    [2,1,2,0,3,0],
    [0,2,0,3,4,5],
    [0,3,6,2,3,5],
    [0,4,1,3,5,6]
], [
    [3],
    [1],
    [2],
    [0],
    [0],
    [0]
])

Aug.invert(0);

console.log(Aug.multiply().extract().source);