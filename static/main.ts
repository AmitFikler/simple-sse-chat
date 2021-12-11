let enteredName = false;
const chat = <HTMLTextAreaElement>document.getElementById('chat');
const text = <HTMLInputElement>document.getElementById('text');
const frm = <HTMLFormElement>document.getElementById('frm');

const myName = prompt('Whats your name?');

if (myName != null) {
  chat.value += 'Connecting...\n';
  enteredName = true;
}

if (enteredName) {
  const source = new EventSource('/chat/' + myName);
  source.onmessage = ({ data }) => {
    data = JSON.parse(data);
    if (data.users) {
      if (document.getElementsByTagName('ul')[0]) {
        document.getElementsByTagName('ul')[0].remove();
      }
      const usersUl = document.createElement('ul');
      for (const user of data.users) {
        console.log(user);
        const userLi = document.createElement('li');
        userLi.textContent = user;
        usersUl.appendChild(userLi);
      }

      document.body.appendChild(usersUl);
    } else {
      chat.value += data + '\n';
      chat.scrollTop = chat.scrollHeight;
      text.value = '';
      text.placeholder = 'Write your message here...';
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  frm.addEventListener('submit', async (e): Promise<void> => {
    e.preventDefault();
    const textToPost = `{
      "name": "${myName}", 
      "text": "${text.value}"
    }`;
    await fetch('/write/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: textToPost,
    });
  });
}
