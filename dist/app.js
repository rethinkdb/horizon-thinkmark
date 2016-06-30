const horizon = Horizon();
const bookmarks = horizon("bookmarks");
const deepClone = obj => JSON.parse(JSON.stringify(obj));

Vue.component("bookmark-item", {
  template: "#bookmark-item",
  props: {
    bookmark: {required: true}
  },
  methods: {
    timestamp(item) {
      return moment(item.time).fromNow();
    }
  }
});

const app = new Vue({
  el: "body",
  
  data: {
    bookmarks: null,
    publicBookmarks: [],
    newBookmark: null,
    editingBookmark: null,
    userId: false,
  },
  
  ready() {
    if (horizon.hasAuthToken()) this.setup();
    else this.showInterface();
    
    horizon("bookmarks").findAll({shared: true})
                        .order("time", "descending").limit(50).watch()
                        .subscribe(bookmarks => this.publicBookmarks = bookmarks);
  },
  
  methods: {
    setup() {
      horizon.currentUser().fetch().forEach(data => {
        this.userId = data.id;
        this.showInterface();
        
        horizon("bookmarks").findAll({user: this.userId})
                            .order("time", "descending").limit(50).watch()
                            .subscribe(bookmarks => this.bookmarks = bookmarks);
      });
    },
    
    showInterface() {
      document.getElementsByTagName("body").item(0).style.display = "block";
    },
    
    login(ev) {
      horizon.authEndpoint("github")
             .subscribe(endpoint => location.pathname = endpoint);
    },
    
    logout(ev) {
      Horizon.clearAuthTokens();
      this.userId = null;
    },
    
    showBookmarkPrompt(ev) {
      this.editingBookmark = null;
      this.newBookmark = {url: "", title: ""};
    },
    
    addBookmark(ev) {
      bookmarks.store({
        user: this.userId,
        bookmark: this.newBookmark,
        time: new Date(),
        shared: false,
      });
      
      this.cancelBookmark(ev);
    },
    
    updateBookmark(ev) {
      bookmarks.replace(this.editingBookmark);
      this.cancelBookmark(ev);
    },
    
    cancelBookmark(ev) {
      this.newBookmark = null;
      this.editingBookmark = null;
    },
    
    edit(item) {
      this.newBookmark = null;
      this.editingBookmark = deepClone(item);
    },
    
    remove(item) {
      bookmarks.remove(item);
    },
    
    share(item) {
      item.shared = true;
      bookmarks.replace(item);
    },
    
    unshare(item) {
      item.shared = false;
      bookmarks.replace(item);
    },
  }
});