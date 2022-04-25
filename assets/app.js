const $ = selector => document.querySelector(selector)

const $userNameInput = $('#username')
const $form = $('#form')
const $joinButton = $('#join')
const $container = $('#container')
const $count = $('#count')

const MAX_PARTICIPANTS = 2

let connected = false
let room

const videoOn = document.getElementById('videoOn');
videoOn.addEventListener('click',() => {
  room.localParticipant.videoTracks.forEach( ({track}) => {
    track.enable()
    console.log(track)
  })
})

const videoOff = document.getElementById('videoOff');
videoOff.addEventListener('click',() => {
  room.localParticipant.videoTracks.forEach( ({track}) => {
    track.disable()
    console.log(track)
  })
})

const speakerMute = document.getElementById('speakerMute');
speakerMute.addEventListener("click",(e)=>{
  e.preventDefault()
  speakerMute.classList.toggle("mute")
  let mute= speakerMute.classList[1]=="mute" ? true : false
  
  room.localParticipant.audioTracks.forEach(({track}) => {
    if(mute){
      track.disable()
      console.log("mute disabled")
      return
    }
    track.enable()
    console.log("activado enabled")
  })
})

async function addLocalVideo () {
  const $localVideo = document.getElementById('local-video')
  const track = await Twilio.Video.createLocalVideoTrack()
  $localVideo.appendChild(track.attach())
}

addLocalVideo()

$form.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  if (connected) {
    disconnect()
    $joinButton.disabled = false
    $joinButton.innerText = 'Join the room'
    return
  }
  
  const username = $userNameInput.value
  if (!username) return alert('Please provide an username')

  $joinButton.disabled = true
  $joinButton.innerText = 'Connecting...'

  try {
    await connect({username})
    $joinButton.disabled = false
    $joinButton.innerText = 'Leave the room'
    speakerMute.style.display = 'inline-block'
    videoOn.style.display = 'inline-block'
    videoOff.style.display = 'inline-block'
  } catch (e) {
    console.error(e)

    alert('Failed to connect')
    $joinButton.disabled = false
    $joinButton.innerText = 'Join the room'
  }
})

async function connect ({username}) {
  const response = await fetch('/get_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({username})
  })

  const data = await response.json()
  room = await Twilio.Video.connect(data.token)
  room.participants.forEach(participantConnected)
  room.on('participantConnected', participantConnected)
  room.on('participantDisconnected', participantDisconnected)
  connected = true
  updateParticipantCount()
}

function disconnect () {
  room.disconnect()
  // quitar la cámara de los divs
  connected = false
  updateParticipantCount()
  speakerMute.style.display = 'none'
  videoOn.style.display = 'none'
  videoOff.style.display = 'none'
}

function updateParticipantCount () {
  $count.innerHTML = `${room.participants.size + 1} online users`
}

function participantConnected (participant) {
  const template = `<div id='participant-${participant.id}' class="participant">
    <div class="video"></div>
    <div>${participant.identity}</div>
  </div>`

  $container.insertAdjacentHTML('beforeend', template)

  participant.tracks.forEach(localTrackPublication => {
    const {isSubscribed, track} = localTrackPublication
    if (isSubscribed) attachTrack(track)
  })

  participant.on('trackSubscribed', attachTrack)
  participant.on('trackUnsubscribed', track => track.detach())
  updateParticipantCount()
}

function attachTrack (track) {
  const $video = $container.querySelector(`.participant:last-child .video`)
  $video.appendChild(track.attach())
}

function participantDisconnected (participant) {
  console.log('participant disconnected')
}