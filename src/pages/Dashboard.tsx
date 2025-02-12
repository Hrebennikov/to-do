import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";  
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [listName, setListName] = useState("");
  const [taskLists, setTaskLists] = useState<any[]>([]);
  const [newTaskText, setNewTaskText] = useState("");

  const createList = async () => {
    if (!user || !listName) {
      alert("Please log in to create a list.");
      return;
    }
    
    try {
      await addDoc(collection(db, "taskLists"), {
        name: listName,
        owner: user.uid,  
        tasks: [], // Початковий список задач порожній
      });
      setListName(""); // Очищуємо поле після створення списку
      fetchTaskLists(); // Оновлюємо список після створення
    } catch (error) {
      console.error("Error creating task list: ", error);
      alert("Error creating task list");
    }
  };

  // Функція для отримання списків
  const fetchTaskLists = async () => {
    if (!user) {
      console.error("User not logged in.");
      return;
    }
  
    try {
      const querySnapshot = await getDocs(collection(db, "taskLists"));
      const lists: any[] = [];
      querySnapshot.forEach((doc) => {
        console.log("Task list owner:", doc.data().owner);
        console.log("Current user UID:", user.uid);
        if (doc.data().owner === user.uid) {
          lists.push({ ...doc.data(), id: doc.id });
        }
      });
      setTaskLists(lists);
    } catch (error) {
      console.error("Error fetching task lists:", error);
      alert(`Error fetching task lists: ${error.message}`);
    }
  };
  


  // Викликаємо fetchTaskLists при монтуванні компоненту
  useEffect(() => {
    fetchTaskLists();
  }, [user]);

  // Функція для редагування назви списку
  const updateListName = async (listId: string, newName: string) => {
    if (!user) return;
    const listRef = doc(db, "taskLists", listId);
    await updateDoc(listRef, { name: newName });
    fetchTaskLists(); // Оновлюємо список після зміни
  };

  // Функція для видалення списку
  const deleteList = async (listId: string) => {
    const listRef = doc(db, "taskLists", listId);
    await deleteDoc(listRef);
    fetchTaskLists(); // Оновлюємо список після видалення
  };

  // Функція для створення нової задачі
  const createTask = async (listId: string) => {
    if (!newTaskText) return; // Перевірка на порожній текст задачі
    const listRef = doc(db, "taskLists", listId);
    const newTask = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
    };

    const updatedTaskLists = taskLists.map((list) => {
      if (list.id === listId) {
        list.tasks = list.tasks || [];
        list.tasks.push(newTask);
      }
      return list;
    });

    await updateDoc(listRef, { tasks: updatedTaskLists[0].tasks });
    setTaskLists(updatedTaskLists);
    setNewTaskText(""); // Очищуємо інпут після створення задачі
  };

  // Функція для зміни статусу задачі
  const toggleTaskCompleted = async (listId: string, taskId: string) => {
    const listRef = doc(db, "taskLists", listId);
    const updatedTaskLists = taskLists.map((list) => {
      if (list.id === listId) {
        list.tasks = list.tasks.map((task: any) => {
          if (task.id === taskId) {
            task.completed = !task.completed;
          }
          return task;
        });
      }
      return list;
    });

    await updateDoc(listRef, { tasks: updatedTaskLists[0].tasks });
    setTaskLists(updatedTaskLists); // Оновлюємо стейт
  };

  // Функція для редагування тексту задачі
  const updateTask = async (listId: string, taskId: string, newText: string) => {
    const listRef = doc(db, "taskLists", listId);
    const updatedTaskLists = taskLists.map((list) => {
      if (list.id === listId) {
        list.tasks = list.tasks.map((task: any) => {
          if (task.id === taskId) {
            task.text = newText;
          }
          return task;
        });
      }
      return list;
    });

    await updateDoc(listRef, { tasks: updatedTaskLists[0].tasks });
    setTaskLists(updatedTaskLists); // Оновлюємо стейт
  };

  // Функція для видалення задачі
  const deleteTask = async (listId: string, taskId: string) => {
    const listRef = doc(db, "taskLists", listId);
    const updatedTaskLists = taskLists.map((list) => {
      if (list.id === listId) {
        list.tasks = list.tasks.filter((task: any) => task.id !== taskId);
      }
      return list;
    });

    await updateDoc(listRef, { tasks: updatedTaskLists[0].tasks });
    setTaskLists(updatedTaskLists); // Оновлюємо стейт
  };

  return (
    <div className="p-4">
      <input
        type="text"
        value={listName}
        onChange={(e) => setListName(e.target.value)}
        placeholder="Назва нового списку"
        className="border p-2 mb-4"
      />
      <button onClick={createList} className="bg-green-500 text-white p-2 ml-2">
        Створити список
      </button>

      {/* Виведення списків і задач */}
      <div className="mt-4">
        {taskLists.length > 0 ? (
          <ul>
            {taskLists.map((list) => (
              <li key={list.id} className="border-b py-2">
                <div className="flex justify-between items-center">
                  <p>{list.name}</p>
                  <button
                    onClick={() => deleteList(list.id)}
                    className="bg-red-500 text-white p-1"
                  >
                    Видалити
                  </button>
                </div>
                <ul>
                  {list.tasks && list.tasks.length > 0 ? (
                    list.tasks.map((task: any) => (
                      <li key={task.id} className="flex items-center justify-between">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTaskCompleted(list.id, task.id)}
                          className="mr-2"
                        />
                        {task.completed ? <s>{task.text}</s> : task.text}
                        <div>
                          <button
                            onClick={() =>
                              updateTask(
                                list.id,
                                task.id,
                                prompt("Enter new task text:", task.text) || task.text
                              )
                            }
                            className="bg-blue-500 text-white p-1 ml-2"
                          >
                            Редагувати
                          </button>
                          <button
                            onClick={() => deleteTask(list.id, task.id)}
                            className="bg-red-500 text-white p-1 ml-2"
                          >
                            Видалити
                          </button>
                          {/* Кнопка для виконання задачі */}
                          <button
                            onClick={() => toggleTaskCompleted(list.id, task.id)}
                            className="bg-green-500 text-white p-1 ml-2"
                          >
                            {task.completed ? "Виконано" : "Виконати"}
                          </button>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li>Немає задач у цьому списку.</li>
                  )}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <p>Немає списків задач.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

