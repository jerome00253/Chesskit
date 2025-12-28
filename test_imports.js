
try {
  const chessops = require('chessops');
  console.log('chessops keys:', Object.keys(chessops));
  
  try {
    const squareSet = require('chessops/squareSet');
    console.log('squareSet found');
  } catch (e) {
    console.log('chessops/squareSet NOT found');
  }

  try {
     const squareSet = require('chessops/square-set');
     console.log('square-set found');
  } catch(e) {
      console.log('chessops/square-set NOT found');
  }
} catch (e) {
  console.error(e);
}
