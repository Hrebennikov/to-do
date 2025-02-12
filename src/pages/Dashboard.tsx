import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface TaskList {
  id: string;
  name: string;
  owner: string;
  collaborators: string[];  
  tasks: Task[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const [listName, setListName] = useState<string>("");
  const [taskLists, setTaskLists] = useState<TaskList[]>([]); 
  const [newTaskText, setNewTaskText] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const createList = async () => {
    if (!user || !listName) {
      alert("Please log in to create a list.");
      return;
    }

    try {
      await addDoc(collection(db, "taskLists"), {
        name: listName,
        owner: user.uid,
        collaborators: [], 
        tasks: [], 
      });
      setListName(""); 
      fetchTaskLists(); 
    } catch (error) {
      console.error("Error creating task list: ", error);
      alert("Error creating task list");
    }
  };

  const fetchTaskLists = async () => {
    if (!user) {
      console.error("User not logged in.");
      return;
    }

    try {
      const querySnapshot = await getDocs(collection(db, "taskLists"));
      const lists: TaskList[] = []; 
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.owner === user.uid) {
          lists.push({ ...data, id: doc.id });
        }
      });
      setTaskLists(lists);
    } catch (error) {
      console.error("Error fetching task lists:", error);
      alert(`Error fetching task lists: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchTaskLists();
  }, [user]);

  const addCollaborator = async (listId: string, email: string) => {
    if (!user) {
      alert("Please log in.");
      return;
    }

    try {
      const listRef = doc(db, "taskLists", listId);
      const listSnapshot = await getDoc(listRef);

      if (listSnapshot.exists()) {
        const listData = listSnapshot.data();
        const collaborators = listData.collaborators || [];

        if (!collaborators.includes(email)) {
          collaborators.push(email);
          await updateDoc(listRef, { collaborators });
          alert("Collaborator added successfully!");
        } else {
          alert("This user is already a collaborator.");
        }
      } else {
        alert("List not found.");
      }
    } catch (error) {
      console.error("Error adding collaborator:", error);
      alert("Error adding collaborator.");
    }
  };

  const createTask = async (listId: string) => {
    if (!newTaskText) return;
    const listRef = doc(db, "taskLists", listId);
    const newTask = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
    };

    const updatedTaskLists = taskLists.map((list: TaskList) => {
      if (list.id === listId) {
        list.tasks = list.tasks || [];
        list.tasks.push(newTask);
      }
      return list;
    });

    await updateDoc(listRef, { tasks: updatedTaskLists[0].tasks });
    setTaskLists(updatedTaskLists);
    setNewTaskText(""); 
  };

  const updateListName = async (listId: string, newName: string) => {
    if (!user) return;
    const listRef = doc(db, "taskLists", listId);
    await updateDoc(listRef, { name: newName });
    fetchTaskLists(); 
  };

  const deleteList = async (listId: string) => {
    const listRef = doc(db, "taskLists", listId);
    await deleteDoc(listRef);
    fetchTaskLists(); 
  };

  const toggleTaskCompleted = async (listId: string, taskId: string) => {
    const listRef = doc(db, "taskLists", listId);
    const updatedTaskLists = taskLists.map((list: TaskList) => {
      if (list.id === listId) {
        list.tasks = list.tasks.map((task: Task) => {
          if (task.id === taskId) {
            task.completed = !task.completed;
          }
          return task;
        });
      }
      return list;
    });

    await updateDoc(listRef, { tasks: updatedTaskLists[0].tasks });
    setTaskLists(updatedTaskLists);
  };

  const deleteTask = async (listId: string, taskId: string) => {
    const listRef = doc(db, "taskLists", listId);
    const updatedTaskLists = taskLists.map((list: TaskList) => {
      if (list.id === listId) {
        list.tasks = list.tasks.filter((task: Task) => task.id !== taskId);
      }
      return list;
    });

    await updateDoc(listRef, { tasks: updatedTaskLists[0].tasks });
    setTaskLists(updatedTaskLists);
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

      <div className="mt-4">
        {taskLists.length > 0 ? (
          <ul>
            {taskLists.map((list: TaskList) => (
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

                <div className="mt-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Введіть email співучасника"
                    className="border p-2 mb-4"
                  />
                  <button
                    onClick={() => addCollaborator(list.id, email)}
                    className="bg-blue-500 text-white p-2 ml-2"
                  >
                    Додати співучасника
                  </button>
                </div>

                <ul>
                  {list.tasks && list.tasks.length > 0 ? (
                    list.tasks.map((task: Task) => (
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
