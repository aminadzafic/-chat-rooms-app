const socket = io()
// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector(
  '#location-message-template'
).innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
})

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
  
  // Visible height
  const visibleHeight = $messages.offsetHeight
  
  // Height of messages container
  const containerHeight = $messages.scrollHeight
  
  // How far have I scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

// listen to message then add it to dom
socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a'),
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

// listen to location message then add it to dom
socket.on('locationMessage', (locationMessage) => {
  const html = Mustache.render(locationMessageTemplate, {
    username: locationMessage.username,
    url: locationMessage.url,
    createdAt: moment(locationMessage.createdAt).format('h:mm a'),
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

// room info 
socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html
  
})


socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})

// event listeners Send message
$messageForm.addEventListener('submit', (e) => {
  e.preventDefault()
  $messageFormButton.setAttribute('disabled', 'disabled')

  const message = e.target.elements.message.value
  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = ''
    $messageFormInput.focus()

    if (error) {
      return console.log(error)
    }
    console.log('Message delivered!') // aknowledgement
  })
})

// send location
$sendLocationButton.addEventListener('click', (e) => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser.')
  }

  $sendLocationButton.setAttribute('disabled', 'disabled')

  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude } = position.coords
    const { longitude } = position.coords
    socket.emit('sendLocation', { latitude, longitude }, () => {
      $sendLocationButton.removeAttribute('disabled')

      console.log('Location shared!')
    })
  })
})
