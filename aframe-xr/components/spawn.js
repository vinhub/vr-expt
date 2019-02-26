AFRAME.registerComponent('spawn', {
  schema: {},

  init: function () {
    // binding all external methods to this
    this.bindMethods()
    // this will hold the x,y positions of the tapping
    this.tapData = null

    // adding a listener to the window itself to get the tapping data
    window.addEventListener('touchstart', this.onTouchStart)

    // adding a listener to the scene to handle the frame updates of the AR scene
    this.el.sceneEl.addEventListener('updateFrame', this.handleSpawn)

  },

  handleSpawn: function (data) {
    // reference to this
    const self = this
    // reference to the callback data
    const frame = data.detail
    // checking if a tap detected
    if (this.tapData !== null) {
      // moving the tapping data to constants, then clearing the data to not repeat the same one
      const x = this.tapData[0];
      const y = this.tapData[1];
      this.tapData = null;

      // calling to the WebXR API method findAnchor, that looks for anchor from a x,y position on screen in scene
      frame.findAnchor(x, y).then(function (anchorData) {
        // if an anchor was found and created, attach it to the entity
        if (anchorData) {
            const entity = self.el
            // add the "xranchor" component, which allows to attach an anchor by id to an entity
            entity.setAttribute('xranchor', {})
            // add the current anchor to the component
            entity.components.xranchor.anchorOffset = anchorData
          }
    })
    .catch(function (err) {
        console.error('Error in hit test', err)
    })
    }
  },

  onTouchStart: function (ev) {
    if (!ev.touches || ev.touches.length === 0) {
      console.error('No touches on touch event', ev)
      return
    }
    this.tapData = [
      ev.touches[0].clientX / window.innerWidth,
      ev.touches[0].clientY / window.innerHeight
    ]
  },

  bindMethods: function () {
    this.onTouchStart = this.onTouchStart.bind(this)
    this.handleSpawn = this.handleSpawn.bind(this)
  }
})
