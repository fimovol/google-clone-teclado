const $ = selector => document.querySelector(selector)

const $userNameInput = $('#username')
const $form = $('#form')
const $joinButton = $('#join')
const $container = $('#container')
const $count = $('#count')

const MAX_PARTICIPANTS = 2

let connected = false
let room

const $videoElement = document.getElementById('video');
$videoElement.addEventListener('click',(e) => {
  e.preventDefault()
  room.localParticipant.videoTracks.forEach( ({track}) => {
    let mute=track.isEnabled
    if(mute){
      track.disable()
      $videoElement.innerHTML= '❌'
      return
    }
    track.enable()
    $videoElement.innerHTML = '📷'
  })
})
const $llamada = document.getElementById('llamada');

$llamada.addEventListener("click",(e) => {
  e.preventDefault()
  if (connected) {
    disconnect()
    $joinButton.disabled = false
    $joinButton.innerText = 'Join the room'
    $count.innerHTML = ''
  }
})
const speakerMute = document.getElementById('speakerMute');
speakerMute.addEventListener("click",(e)=>{
  e.preventDefault()
  room.localParticipant.audioTracks.forEach(({track}) => {
    let mute=track.isEnabled
    if(mute){
      track.disable()
      speakerMute.innerHTML= '🔇'
      return
    }
    track.enable()
    speakerMute.innerHTML = '🎙️'
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
    $count.innerHTML = ''
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
    aparecerIconos()

  } catch (e) {
    console.error(e)

    alert('Failed to connect')
    $joinButton.disabled = false
    $joinButton.innerText = 'Join the room'
  }
})
function aparecerIconos (){
   speakerMute.style.display = 'flex'
    $llamada.style.display = 'flex'
    $videoElement.style.display = 'flex'
}
function desaparecerIconos(){
  speakerMute.style.display = 'none'
  $llamada.style.display = 'none'
  $videoElement.style.display = 'none'
}

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
  // quitar todo menos el primero .camara.participant:nth-child(1n+2)
  var elem = document.querySelectorAll('.camara.participant:nth-child(1n+2)')
  elem.forEach(box => {
    box.remove();
  })
  connected = false
  updateParticipantCount()
  desaparecerIconos()
}


function updateParticipantCount () {
  $count.innerHTML = `${room.participants.size + 1} online users`
}
// participant.identity
//participant.id
let sid=null
function participantConnected (participant) {
   sid = participant.sid
  const template = `<div class="camara participant video ${sid}" id="local-video">
    <span class="spanyo">${participant.identity}</span>
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
  const $video = $container.querySelector(`.camara.participant.video.${sid}`)
  $video.appendChild(track.attach())
}

function participantDisconnected (participant) {
  console.log('participant disconnected')
}