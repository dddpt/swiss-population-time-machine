"use strict";

/**
 * Class handling Internationalisation
 *
 * The basics:
 * 1) It uses (flat) dictionaries key->translation for each language.
 * 2) Each tag containing text should have a tag attribute "data-i18n" containing the corresponding dictionary key.
 *    Internationalisation constantly watches for changes to "data-i18n" attributes, so they can be added or removed on-the-fly
 * It also handles dynamic content:
 * 3) dynamic data for each tag can be held as JSON in its "data-i18n-data" attribute, to add data, you can use i18n.data().
 *    The data in the "data-i18n-data" can be any valid JSON object.
 * 4) Texts are dynamically modified by adding a function to the corresponding "data-i18n" keys in
 *    Internationalisation "dynamic" dictionary. those function should be of the form function(str,JSONdata) -> str.
 *
 *
 * For example:
 * <div class="node-name" spellcheck="false" data-i18n="node-name-you" maxlength="26" rows="2"></div>
 * Indicates that this div contains the text corresponding to "node-name-you"
 */
class Internationalisation{

  /**
   *
   * @param {Array[string]} supportedLanguages an array of language string identifiers (e.g ["en", "fr","de"])
   * @param {function} languageLoader a (possibly async) function taking as argument a language string from
   *         supportedLanguages and returning the translations.
   * @param {string} lng a language string identifier, the chosen language to display the website.
   * @param {dictionary[string,function]} dynamic a dictionary str->function to handle dynamic content.
   * @param {string} keyAttr the name of the html5 attribute to watch for keys, by default "data-i18n"
   * @param {string} dataAttr the name of the html5 attribute to watch for data, by default "data-i18n-data".
   */
  constructor(supportedLanguages, languageLoader, lng=false, dynamic = {}, keyAttr = "data-i18n", dataAttr = "data-i18n-data", useLocalStorage=true){
    this.dynamic = dynamic
    this.keyAttr = keyAttr
    this.dataAttr = dataAttr
    this.useLocalStorage = useLocalStorage
    this.supportedLanguages = supportedLanguages
    this.defaultLanguage = this.supportedLanguages[0]
    this.languageChangeCallbacks = []
    // take language from url (if lng param present): on all browsers but IE
    if(!(navigator.userAgent.indexOf('MSIE')!==-1 || navigator.appVersion.indexOf('Trident/') > -1)){ //not-IE detection
      let params = (new URL(document.location)).searchParams;
      if (supportedLanguages.includes(params.get("lng"))){
          lng = params.get("lng")
      }
    }
    this.lng = lng
    // try to take it from navigator.language:
    if(!this.lng){
      this.lng = this.supportedLanguages.find(ln=>navigator.language.match(ln))
    }
    // try to take it from navigator.languageS:
    if( (!this.lng) && navigator.languages){
      this.lng = this.supportedLanguages.find(ln=> navigator.languages.includes(ln))
    }    
    //otherwise, use default:
    if(!this.lng){
      this.lng = this.defaultLanguage
    }
    this.languageLoader = languageLoader
    this.translations = {}
    // translationsPromises: ensure we await the translations are loaded before we t()/fill()/refresh()
    this.translationsPromises = {}

    // observerConfig: we follow changes to this.keyAttr (="data-i18n") attribute
    this._observerConfig = {
      attributes: true,
      attributeFilter: [this.keyAttr, this.dataAttr],
      subtree:true
    }

    // function wrapper needed as "this" will actually refer to the MutationObserver
    let mutationCallback = function(obj){
      return function(mutations) {
        mutations.forEach(m => obj.fill(m.target))
      }
    }(this)

    this._observer = new MutationObserver(mutationCallback);

    this.changeLanguage(this.lng)
  }

  /** Get or sets the data for the given data-i18n key
   *
   * @param {str} key a data-i18n key
   * @param {Object} data null to get the current data, or an object to set the data for the key
   */
  data(key, data=false){
    let elList = document.querySelectorAll("["+this.keyAttr+"="+key+"]")
    if(elList.length==0){ return null }
    if(!data){
      return elList[0]
    }
    data = JSON.stringify(data)
    for(let el of elList){
      el.setAttribute(this.dataAttr,data)
    }
  }

  /** Gives text in currently selected language, with optional string formatter
   * @param {string} key a valid translation key
   * @param {Object} data data for the formatter (or an array of replacements for {})
   * @param {function(string, data): string} formatter an optional formatter, by default the corresponding function in this.dynamic
   */
  async t(key, data=[], formatter = this.dynamic[key],lng=this.lng){
    await this.translationsPromises[lng]
    //console.log("t(), key: ",key,", data: ", data, ", formatter: ",formatter)
    let text = this.translations[lng][key]
    //console.log("t(), text: ", text)
    if(formatter){
      text = formatter(text,data)
    } else {
      for(let d of data){
        text = text.replace("{}",d)
      }
    }
    return text
  }

  /** fills the given DOM node with its text in the current language.
   */
  async fill(DOMnode){
    if(DOMnode.hasAttribute(this.keyAttr)){
      let key = DOMnode.getAttribute(this.keyAttr)
      // if tag also as i18n data fill the text with it
      let data = DOMnode.hasAttribute(this.dataAttr) ?
        JSON.parse(DOMnode.getAttribute(this.dataAttr)) :
        []
      //console.log(DOMnode, "to be filled with key: '"+key+"' and data: ", data)
      DOMnode.innerHTML = await this.t(key, data)
      return DOMnode.innerHTML
    }else{
      return -1
      //console.log("this node no longer has "+this.keyAttr+" attribute:", n)
    }
  }

  /** Observe changes to the given DOM node for translations.
   */
  observe(DOMnode = document){
    return this._observer.observe(DOMnode, this._observerConfig)
  }

  /** refreshes the translations of the given DOM node and its subtree.
   */
  async refresh(DOMnode = document){
    return Promise.all([...DOMnode.querySelectorAll("["+this.keyAttr+"]")].map(n => this.fill(n)))
  }

  /** Loads the asked language.
   * @param {string} lng language string identifier
   */
  async loadLanguage(lng){
    let translation = this.useLocalStorage? this.loadLngFromLocalStorage(lng) : false
    if(translation){
      this.translations[lng] = translation
    }
    else{
      this.translationsPromises[lng] = this.languageLoader(lng)
      this.translations[lng] = await this.translationsPromises[lng]
      if(this.useLocalStorage){
        this.saveLngToLocalStorage(lng)
      }
    }
  }

  /** Change to given language, handles the loading of translations if needed
   * @param {string} lng language string identifier
   */
  async changeLanguage(lng){
    let oldLng = this.lng
    this.lng = lng
    if(!this.translations[lng]){
      try{
        await this.loadLanguage(lng)
      }catch(e){
        console.log('Unable to change language, loading of translations for "'+lng+'" failed. Error: ',e)
      }
    }
    // only change language if loading successful (or pre-existing)
    if(this.translations[lng]){
      await this.refresh()
      this.languageChangeCallbacks.forEach(cb => cb(oldLng,lng))
    }
  }

  loadLngFromLocalStorage(lng, transKey = "translation."+lng,saveDateKey="translation_save_date."+lng){
    let transDict = localStorage.getItem(transKey)
    let transDictSaveDate = +localStorage.getItem(saveDateKey)
    if(Boolean(transDict) & (transDictSaveDate+2*3600*1000>=+new Date()) ){
      return JSON.parse(transDict)
    }
    return null
  }

  saveLngToLocalStorage(lng, transKey = "translation."+lng,saveDateKey="translation_save_date."+lng){
    localStorage.setItem(transKey,JSON.stringify(this.translations[lng]))
    localStorage.setItem(saveDateKey,+new Date())
  }
  
  resetLngLocalStorage(){
    for(let lng of this.supportedLanguages){
      localStorage.setItem("translation."+lng,null)
      localStorage.setItem("translation_save_date."+lng,null)
    }
  }
}
