import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import Peer from 'peerjs';
import { connect } from 'http2';

type PeerMessage = {
  id: number
  lamportClock: number
  message: string
};
function randId(): string {
  let roomLength = 6
  let lowChar = "A".charCodeAt(0)
  let highChar = "Z".charCodeAt(0)
  let possibleChars = highChar - lowChar + 1
  let randChar = () => {
    let r = Math.round(Math.random() * possibleChars) + lowChar
    return String.fromCharCode(r)
  }
  return [...new Array(roomLength).keys()].map(randChar).join("");
}

function App() {
  const [peer] = useState<Peer>(new Peer(randId(), {
    host: '45.79.192.219',
    port: 9000,
    path: '/myapp'
  }))
  const [chatLog, setChatLog] = useState<string[]>([''])
  const [lamportClock, setLamportClock] = useState<number>(0)
  const [receivedMessageIds, setReceivedMessageIds] = useState<number[]>([])
  const [listOfConnections, setListOfConnections] = useState<Peer.DataConnection[]>([])

  var inputBoxConnectionId = ''
  var inputBoxChatMessage = ''

  useEffect(() => {
    peer.on('connection', function (conn) {
      conn.on('data', function (data: PeerMessage) {
        //check in incoming connection is not already in list
        if (listOfConnections.find(x => x.peer === conn.peer) === undefined) {
          var connection = peer.connect(conn.peer)
          setListOfConnections(currentListOfConnections => ([...currentListOfConnections,connection]))
        }
        setLamportClock(lamportClock > data.lamportClock ? lamportClock + 1 : data.lamportClock + 1);
        //check if message is already received
        if (receivedMessageIds.find(x => x === data.id) === undefined) {
          setReceivedMessageIds(currentReceivedMessageIds => ([...currentReceivedMessageIds, data.id]))
          setChatLog(currentChatLog => ([...currentChatLog, parseMessage(data)]))
          //broadcast message to all connections
          listOfConnections.forEach(x => x.send(data))
        }
      });
    });
  }, []);

  function parseMessage(message: PeerMessage) {
    return ` L(${message.lamportClock}): ${message.message}`
  }

  function onConnectionIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    inputBoxConnectionId = e.target.value
  }
  function onAddNewConnection(id: string){
    const conn=peer.connect(id);
    setListOfConnections(prev => [...prev, conn])
  }
  function onChatChange(e: React.ChangeEvent<HTMLInputElement>) {
    inputBoxChatMessage = e.target.value
  }
  function onSubmitConnectionRequest() {
    onAddNewConnection(inputBoxConnectionId)
  }
  function onSubmitChat() {
    setLamportClock(currentLamportClock => (currentLamportClock + 1))
    var message: PeerMessage = {id: Math.floor(Math.random()*1000000), lamportClock: lamportClock, message: inputBoxChatMessage }
    setChatLog([...chatLog, parseMessage(message)])
    listOfConnections.forEach(connection => {
      console.log(connection.peer)
      connection.send(message)
    });
  }

  return (
    <div className="container">
      <h1>ID: {peer.id}</h1>
      <div>
        <label>
          Connect to id:
          <input type="text" name="name" onChange={onConnectionIdChange}/>
        </label>
        <input className="btn btn-primary" type="submit" value="Submit" onClick={onSubmitConnectionRequest}></input>
      </div>
      <div>
        <h4>Current Connections</h4>
        {listOfConnections.map((connection, index) => {
          return <p key={index}>{connection.peer}</p>
        })}
      </div>
      <div>
        <h2>Chat</h2>
        {chatLog.map((message, index) => {
          return <p key={index}>{message}</p>
        })}
      </div>
      {listOfConnections.length == 0 ?
        <p>not connected</p> :
        <div>
          <label>
            Chat:
            <input type="text" name="name" onChange={onChatChange} />
          </label>
          <input className="btn btn-primary" type="submit" value="Submit" onClick={onSubmitChat}></input>
        </div>
      }
    </div>
  );
}

export default App;