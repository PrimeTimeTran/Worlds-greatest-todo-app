import React, { useState, useEffect } from "react";

import firebase from "firebase";
import { BrowserRouter as Router, Route } from "react-router-dom";

import Footer from "./components/Footer";
import TodoList from "./components/TodoList";
import TodoInput from "./components/TodoInput";
import Navigation from "./components/Navigation";
import SortingOptions from "./components/SortingOptions";

import { randomBackgroundImage } from "./utils";

import "./App.css";

const firebaseConfig = {
  storageBucket: "",
  appId: process.env.REACT_APP_APP_ID,
  apiKey: process.env.REACT_APP_API_KEY,
  projectId: process.env.REACT_APP_PROJECT_ID,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID
};

firebase.initializeApp(firebaseConfig);

function App() {
  const [email, setEmail] = useState("");
  const [filter, setFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [todoList, setTodoList] = useState([]);
  const [newTodoBody, setNewTodoItem] = useState("");
  const [allTodoItems, setAllTodoItems] = useState([]);
  const [currentUser, setCurrentUser] = useState({ uid: "", email: "" });
  const [bgImage, setBgImage] = useState({
    backgroundImage: `url(${randomBackgroundImage()})`
  });

  useEffect(() => {
    const setupApp = () => {
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          setCurrentUser({
            uid: user.uid,
            email: user.email
          });

          const db = firebase.firestore();
          const todosRef = db.collection("todos");
          const query = todosRef
            .where("uid", "==", user.uid)
            .orderBy("createdAt", "asc");

          const todos = [];

          query
            .get()
            .then(querySnapshot => {
              querySnapshot.forEach(doc => {
                const todo = {
                  ...doc.data(),
                  id: doc.id
                };
                todos.push(todo);
              });
              save(todos);
            })
            .catch(error => {
              console.log("Error getting document:", error);
            });
        } else {
          setCurrentUser({ uid: "" });
        }
        setLoading(false);
      });
    };
    setupApp();
  }, [newTodoBody]);

  const save = list => {
    setAllTodoItems(list);
    setTodoList(list);
  };

  const onSignIn = () => {
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(user => {
        setCurrentUser({
          uid: user.uid,
          email: user.user.email
        });
        setPassword("");
        setEmail("");
      })
      .catch(error => {
        console.log("Account not found, creating a new one!");
        createUserAccount();
      });
  };

  const createUserAccount = () => {
    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(user => {
        setCurrentUser({
          uid: user.uid,
          email: user.user.email
        });
        setPassword("");
        setEmail("");
      })
      .catch(error => {
        console.log("Failed to create new account!");
      });
  };

  const onSignOut = () => {
    firebase
      .auth()
      .signOut()
      .then(
        () => {
          console.log("Signed Out");
          setCurrentUser({ uid: "" });
          save([]);
        },
        error => {
          console.error("Sign Out Error", error);
        }
      );
  };

  const submitTodo = (body, idx) => {
    if (idx !== undefined) {
      editTodo(idx, body);
    } else {
      createNewTodo(body);
    }
  };

  const createNewTodo = body => {
    const db = firebase.firestore();
    const newTodo = {
      body: body,
      status: "Active",
      uid: currentUser.uid,
      createdAt: new Date()
    };

    const jsonTodo = JSON.parse(JSON.stringify(newTodo));
    db.collection("todos")
      .add(jsonTodo)
      .then(docRef => {
        newTodo.id = docRef.id;
      })
      .catch(error => {
        console.error("Error adding document: ", error);
      });
    const newTodoList = [...todoList, newTodo];
    save(newTodoList);
    setNewTodoItem("");
    setBgImage({
      backgroundImage: `url(${randomBackgroundImage()})`
    });
  };

  const editTodo = (id, body) => {
    const updatedTodo = todoList.find(todo => todo.id === id);
    updatedTodo.body = body;
    const foundIndex = todoList.findIndex(todo => todo.id === id);
    todoList[foundIndex] = updatedTodo;
    const newTodoList = [...todoList];
    save(newTodoList);
    saveToFireStore(id);
  };

  const saveToFireStore = id => {
    const db = firebase.firestore();
    const newTodo = todoList.find(todo => todo.id === id);
    const jsonTodo = JSON.parse(JSON.stringify(newTodo));
    if (id) {
      db.collection("todos")
        .doc(id)
        .set(jsonTodo);
    } else {
      db.collection("todos")
        .doc()
        .set(jsonTodo);
    }
  };

  const keyPress = e => {
    if (e.keyCode === 13) submitTodo(newTodoBody);
  };

  const onToggleTodo = id => {
    const newTodo = todoList.find(todo => todo.id === id);

    if (newTodo.status === "Done") {
      newTodo.status = "Active";
    } else {
      newTodo.status = "Done";
    }

    let foundIndex = todoList.findIndex(todo => todo.id === id);
    todoList[foundIndex] = newTodo;

    const newTodoList = [...todoList];
    save(newTodoList);
    saveToFireStore(id);
  };

  const setNewFilter = type => {
    if (type === null) return setTodoList(allTodoItems);
    const filteredTodoList = allTodoItems.filter(todo => todo.status === type);
    setTodoList(filteredTodoList);
    setFilter(type);
  };

  const onDeleteTodo = id => {
    const db = firebase.firestore();
    const todoRef = db.collection("todos");
    todoRef
      .doc(id)
      .delete()
      .then(() => {
        const newTodoList = todoList.filter(todo => todo.id !== id);
        save(newTodoList);
      })
      .catch(error => {
        console.error("Error removing document: ", error);
      });
  };

  return (
    <div className="App" style={bgImage}>
      <Navigation
        email={email}
        password={password}
        onSignIn={onSignIn}
        setEmail={setEmail}
        onSignOut={onSignOut}
        setPassword={setPassword}
        currentUser={currentUser}
      />
      <TodoInput
        keyPress={keyPress}
        newTodoBody={newTodoBody}
        currentUser={currentUser}
        setNewTodoItem={setNewTodoItem}
      />
      <SortingOptions
        filter={filter}
        allTodoItems={allTodoItems}
        setNewFilter={setNewFilter}
      />
      <TodoList
        loading={loading}
        todoList={todoList}
        keyPress={keyPress}
        currentUser={currentUser}
        submitEditTodo={submitTodo}
        onToggleTodo={onToggleTodo}
        onDeleteTodo={onDeleteTodo}
      />
      <Footer />
    </div>
  );
}

const RoutedApp = () => (
  <Router>
    <Route path="/" component={App} />
  </Router>
);

export default RoutedApp;
