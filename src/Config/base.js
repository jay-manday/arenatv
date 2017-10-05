import Rebase from 're-base'
import firebase from 'firebase/app'
import database from 'firebase/database'

const config = {
  apiKey: process.env.REACT_APP_SECRET_CODE,
  authDomain: "multi-tv-f034c.firebaseapp.com",
  databaseURL: "https://multi-tv-f034c.firebaseio.com",
  projectId: "multi-tv-f034c",
  storageBucket: "multi-tv-f034c.appspot.com",
  messagingSenderId: process.env.REACT_APP_MESSAGING_CODE
}

const app = firebase.initializeApp(config)

const db = database(app)
const base = Rebase.createClass(db)

export default base
