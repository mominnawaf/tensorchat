document.addEventListener("DOMContentLoaded", event => {
  let localStream,
    client = {};
  const Peer = require("simple-peer");
  const io = require("socket.io-client");
  const socket = io("https://p2p-beta.herokuapp.com/");
  const host_stream = document.getElementById("host_stream");
  const remote_stream = document.getElementById("remote_stream");
  const disableVideo = document.getElementById("disablevideo");
  const mute = document.getElementById('mute');
  const hangup = document.getElementById('hangup');
  const inviteBtn = document.getElementById('invite');
  const inviteModal = document.getElementById('invite-modal');
  

  //initialize app with getUserMedia
  navigator.getMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: true
    })
    .then(stream => {
      //emit new client
      socket.emit("new_client", room);
      localStream = stream;
      host_stream.setAttribute("autoplay", "");
      host_stream.setAttribute("muted", "");
      host_stream.setAttribute("playsinline", "");

      if ("srcObject" in host_stream) {
        host_stream.srcObject = stream;
      } else {
        // old browsers
        host_stream.src = URL.createObjectURL(stream);
      }

      //Peer constructor
      const init_peer = type => {
        let peer = new Peer({
          initiator: type == "init" ? true : false,
          stream: localStream,
          trickle: false
        });
        peer.on("stream", stream => {
          remote_stream.setAttribute("autoplay", "");
          remote_stream.setAttribute("muted", "");
          remote_stream.setAttribute("playsinline", "");

          if ("srcObject" in remote_stream) {
            remote_stream.srcObject = stream;
          } else {
            // old browsers
            remote_stream.src = URL.createObjectURL(stream);
          }
        });

        return peer;
      };

      //Create host
      const make_peer = () => {
        client.gotAnswer = false;
        let peer = init_peer("init");
        peer.on("signal", data => {
          if (!client.gotAnswer) {
            socket.emit("offer", room, data);
          }
        });
        client.peer = peer;
      };

      //Create remote peer
      const make_remote_peer = offer => {
        let peer = init_peer("notinit");
        peer.on("signal", data => {
          socket.emit("answer", room, data);
        });
        peer.signal(offer);
        client.peer = peer;
      };

      //session active message
      const session_active = () => {
        document.write("Session Active. Please try again later!");
      };

      //handle answer
      const signal_answer = answer => {
        client.gotAnswer = true;
        let peer = client.peer;
        peer.signal(answer);
      };

      //handle destroy peer
      const remove_peer = () => {
        remote_stream.remove();
        if (client.peer) {
          client.peer.destroy();
          }
      };

      //hangup 
      hangup.addEventListener('click', ()=>{
        window.location.href = "https://tensorchat.herokuapp.com";
        remove_peer();
      })

      //mute audio
      mute.addEventListener('click', ()=>{
        let audioTracks = localStream.getAudioTracks();
        for (var i = 0; i < audioTracks.length; ++i) {
          audioTracks[i].enabled = !audioTracks[i].enabled;
        }
      })

      //disable video
      disableVideo.addEventListener('click', ()=>{
        videoTracks= localStream.getVideoTracks();
        for (var i = 0; i < videoTracks.length; ++i) {
          videoTracks[i].enabled = !videoTracks[i].enabled;
        }
      })

      //invite 
  


      //events
      socket.on("sent_offer", make_remote_peer);
      socket.on("sent_answer", signal_answer);
      socket.on("remove_peer", remove_peer);
      socket.on("session_active", session_active);
      socket.on("create_peer", make_peer);
    })
    .catch(err => {
      alert("Cannot get access to your camera! Check logs for more info.");
      console.log(err);
    });
});