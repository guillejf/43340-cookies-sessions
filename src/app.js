import cookieParser from 'cookie-parser';
import express from 'express';
import handlebars from 'express-handlebars';
import path from 'path';
import { petsRouter } from './routes/pets.router.js';
import { testSocketChatRouter } from './routes/test.socket.chat.router.js';
import { usersHtmlRouter } from './routes/users.html.router.js';
import { usersRouter } from './routes/users.router.js';
import { __dirname, connectMongo, connectSocket } from './utils.js';
import session from 'express-session';

const app = express();
const port = 8000;

const httpServer = app.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`);
});

connectMongo();
connectSocket(httpServer);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser('coder-secret'));
app.use(session({ secret: 'un-re-secreto', resave: true, saveUninitialized: true }));

app.engine('handlebars', handlebars.engine());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

// app.use(express.static("public"));
app.use(express.static(path.join(__dirname, 'public')));

//Rutas: API REST CON JSON
app.use('/api/users', usersRouter);
app.use('/api/pets', petsRouter);

//Rutas: HTML RENDER SERVER SIDE
app.use('/users', usersHtmlRouter);

//Rutas: SOCKETS
app.use('/test-chat', testSocketChatRouter);

app.get('/show-session', (req, res) => {
  console.log(req.sessionID);
  console.log(req.session);
  res.send('ver la consola');
});

app.get('/session', (req, res) => {
  if (req.session.cont) {
    req.session.cont++;
    res.send('nos visitaste ' + req.session.cont);
  } else {
    req.session.cont = 1;
    res.send('nos visitaste ' + 1);
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.json({ status: 'Logout ERROR', body: err });
    }
    res.send('Logout ok!');
  });
});

app.get('/login', (req, res) => {
  const { username, password } = req.query;
  if (username !== 'pepe' || password !== 'pepepass') {
    return res.send('login failed');
  }
  req.session.user = username;
  req.session.admin = false;
  res.send('login success!');
});

function checkUser(req, res, next) {
  if (req.session.user) {
    return next();
  }
  return res.status(401).send('error de autorización!');
}

app.get('/perfil', checkUser, (req, res) => {
  res.send('PERFIl');
});

/* 
app.get('/setCookie', (req, res) => {
  res.cookie('cookie-test-firma', 'sin firma', { maxAge: 1000000 });
  res.cookie('cookie-test', 'dato x', { maxAge: 1000000, signed: true });
  res.cookie('cookie-test2', 'dato x 2', { maxAge: 1000000, signed: true });
  res.cookie('cookie-test3', 'dato x 3', { maxAge: 1000000, signed: true });
  return res.json({ msg: 'cookie puesta! abri tu consola y fijate como ya te la agregue' });
});

app.get('/getCookies', (req, res) => {
  console.log('cookies', req.cookies);
  console.log('signedCookies', req.signedCookies);
  res.send('nada');
});

app.get('/deleteCookie', (req, res) => {
  res.clearCookie('cookie-test');
  res.clearCookie('cookie-test2');
  res.clearCookie('cookie-test3');

  res.send('borrado! fijate en la consola y ya no las tenes!!! jajajaj');
}); */

app.get('*', (req, res) => {
  return res.status(404).json({
    status: 'error',
    msg: 'no encontrado',
    data: {},
  });
});
