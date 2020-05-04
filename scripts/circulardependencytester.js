const madge = require('madge');
 
madge('./main.js').then((res) => {
    console.log(res.circular());
});