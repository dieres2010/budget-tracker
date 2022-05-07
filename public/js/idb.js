let db;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore("new_trans", { keyPath: 'id', autoIncrement: true });
};

request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run checkDatabase() function to send all local db data to api
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorcode)
};

function saveRecord(record) {

    const transaction = db.transaction(["new_trans"], "readwrite");
    const objectStore = transaction.objectStore("new_trans");
    objectStore.add(record);
}

function checkDatabase() {

    const transaction = db.transaction(["new_trans"], "readwrite");
    const objectStore = transaction.objectStore("new_trans");
    const getAll = objectStore.getAll();
    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                    method: 'POST',
                    body: JSON.stringify(getAll.result),
                    headers: {
                        Accept: 'application/json, text/plain, */*',
                        'Content-Type': 'application/json',
                    },
                })
                .then((response) => response.json())
                .then(() => {
                    const transaction = db.transaction(["new_trans"], "readwrite");
                    const objectStore = transaction.objectStore("new_trans");
                    objectStore.clear();
                });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', checkDatabase);