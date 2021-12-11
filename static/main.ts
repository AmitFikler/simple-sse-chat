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
  source.onmessage = (e) => {
    chat.value += e.data + '\n';
    chat.scrollTop = chat.scrollHeight;
    text.value = '';
    text.placeholder = 'write your text..';
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
