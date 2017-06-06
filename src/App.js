import React, { Component, PropTypes } from 'react'
import {browserHistory} from 'react-router-dom'
import base from './helpers/base'
import Client from './Client'
import ChannelList from './ChannelList'
import { decode, configureUrlQuery, addUrlProps, replaceUrlQuery, UrlQueryParamTypes } from 'react-url-query'
import Favicon from 'react-favicon'
import config from './config'
import './App.css'

const urlPropsQueryConfig = {
  URICurrentChannel: { type: UrlQueryParamTypes.string, queryParam: 'ch' },
}

configureUrlQuery({
  addRouterParams: false,
})

const defaultChannelSlug = 'herzog'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      currentChannel: !this.props.URICurrentChannel ? 'herzog' : this.props.URICurrentChannel,
      currentChannelName: '',
      currentVideoName: '',
      channels: [],
      numUsers: 0,
      muted: false,
      currentVideoStatus: -1,
      trayOpen: false,
    }
    replaceUrlQuery({'ch': this.state.currentChannel })
  }

  componentWillReceiveProps = (nextProps) => {
    if (nextProps.URICurrentChannel !== this.props.URICurrentChannel) {
      this.setState({
        currentChannel: nextProps.URICurrentChannel,
      })
    }
  }

  componentWillMount = () => {
    this.getChannels()


    // this.getVids('arena-tv')
    // if channels changes, get all videos again
    // base.listenTo('channels', {
    //   context: this,
    //   asArray: true,
    //   then(channels){
    //     this.getChannels()
    //   },
    // })
  }



  classifyItem = (item) => {
    const isMedia = item.class === "Media"
    if (isMedia && item.source.url.indexOf('list') > 0) return "playlist"
    if (isMedia && item.source.url.indexOf('youtube') > 0) return "youtube"
    return 'notSupported'
  }

  getYoutubeId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[7].length === 11) ? match[7] : '3_XooZ65n6c'
  }

  // make a list of channels and their videos
  getChannels = () => {
      let component = this
      const getChannels = fetch(`${config.apiBase}/channels/arenatv`)
      getChannels.then(resp => resp.json()).then(channels => {
        let channelArr = channels.contents
        //make sure channel has contents
        channelArr = channelArr.filter(channel => {
          return channel.length > 0
        })
        component.setState({channels: channelArr})
        channelArr.map((channel) => {
          base.update(`channels/${channel.slug}`, {
            data: {
              slug: channel.slug,
              title: channel.title,
              health: 0,
              username: channel.user.username,
              // currentVideoIndex: 0,
              // time: 0,
            },
          }).then(this.getCurrentChannelName(this.state.currentChannel))
        })
      })
    }

  getVids = (targetSlug) => {
    const channels = this.state.channels
    const channelToQuery = channels.filter((channel) => {
      return channel.slug === targetSlug
    })
    const slugToQuery = channelToQuery[0].slug
    const getVideos = fetch(`${config.apiBase}/channels/${slugToQuery}/contents`)
    getVideos.then(resp => resp.json()).then(videos => {
      let youtubeVids = videos.contents.filter((video) => {
        return this.classifyItem(video) === 'youtube'
      })
      console.log(youtubeVids)
      let youtubeSlugs = youtubeVids.map((video) => {
        return video = {url: this.getYoutubeId(video.source.url), title: video.title}
      })
      base.update(`channels/${targetSlug}`, {
        data: {videos: youtubeSlugs},
      })
    })
  }

  handleChangeChannel = (e, target) => {
    replaceUrlQuery({'ch': target})
    this.getCurrentChannelName(target)
    this.getVids(target)
    e.stopPropagation()
    e.preventDefault()
  }

  handleChangeUsers = (num) =>{
    this.setState({
      numUsers: num,
    })
  }

  onMuteVideo = (event) => {
    this.setState({
      muted: !this.state.muted,
    })
    event.stopPropagation()
    event.preventDefault()
  }

  getVideoStatus = (status) => {
    this.setState({
      currentVideoStatus: status,
    })
  }

  getCurrentChannelName = (target) => {
    const currentChannel = this.state.channels.filter(channel => {
      return channel.slug === target
    })
    this.setState({
      currentChannelName: currentChannel[0].title,
    })
  }

  getCurrentVideoName = (name) => {
    this.setState({
      currentVideoName: name,
    })
  }

  indicateStatus = () => {
    let status
    switch(this.state.currentVideoStatus) {
    case -1:
        status = 'unstarted'
        break
    case 0:
        status = 'ended'
        break
    case 1:
        status = 'playing'
        break
    case 2:
        status = 'paused'
        break
    case 3:
        status = 'buffering'
        break
    case 5:
        status = 'cued'
        break
    default:
        status = 'error'
    }
  return (`${status} indicator`)
  }

  toggleTrayState = (event) => {
    const trayOpen = this.state.trayOpen
    this.setState({
      trayOpen: !trayOpen,
    })
    event.stopPropagation()
    event.preventDefault()
  }


  setTrayClass = () => {
    const trayOpen = this.state.trayOpen
    let classToSet
    if (trayOpen) {
      classToSet = 'trayOpen'
    } else {
      classToSet = 'trayClosed'
    }
    return classToSet
  }

  handleFavicon = () => {
    let status
    switch(this.state.currentVideoStatus) {
    case -1:
        status = 'unstarted'
        break
    case 0:
        status = 'ended'
        break
    case 1:
        status = 'playing'
        break
    case 2 || 5:
        status = 'paused'
        break
    case 3:
        status = 'buffering'
        break
    case 5:
        status = 'cued'
        break
    default:
        status = 'error'
    }
  return (`icons/${status}.png`)
  }


  render() {
    const maybePluralize = (count, noun, suffix = 's') =>
      `${noun}${count !== 1 ? suffix : ''}`
    const isare = (count, noun, suffix = 'is') =>
      `${count !== 1 ? noun : suffix}`

    return (
      <div className="App">
        <div className={'videoFrame'}>
          <div className="overlayContainer">
            <div className="overlay">
              <header>
              <div className={'logoMark'}>
                <div className={'mark'} />
                <h1>{'– tv'}</h1>
              </div>
                <button id="channels" onClick={(e) => this.toggleTrayState(e)}><h2>{`${this.state.channels.length} Channels`}</h2></button>
              </header>
              <footer>
              <div className={'info'}>
                <div className={this.indicateStatus()} />
                <Favicon url={this.handleFavicon()}/>
                <div className={'spacer'} />
                <h2>{this.state.currentChannelName}</h2>
                <div className={'spacer'} />
                <p>{this.state.currentVideoName}</p>
                <div className={'spacer'} />
                <p>{this.state.numUsers-1} {maybePluralize(this.state.numUsers-1, 'other')} {isare(this.state.numUsers-1, 'are')} watching with you.</p>

              </div>
              <button
                className="button"
                id="mute"
                onClick={(e) => this.onMuteVideo(e)}>{this.state.muted ? <div className={'sound_off'} /> : <div className={'sound_on'} />}
              </button>
              </footer>
            </div>
              <Client
                currentChannel={this.state.currentChannel}
                handleChangeUsers={this.handleChangeUsers}
                trayOpen={this.state.trayOpen}
                muted={this.state.muted}
                getVideoStatus={this.getVideoStatus}
                getCurrentVideoName={this.getCurrentVideoName}
              />
          </div>
        </div>
        <div className={this.setTrayClass()}>
          <ChannelList
            handleChangeChannel={this.handleChangeChannel}
            channels={this.state.channels}
            currentChannel={this.state.currentChannel}
          />
        </div>
      </div>
    )
  }
}

export default addUrlProps({ urlPropsQueryConfig })(App)
