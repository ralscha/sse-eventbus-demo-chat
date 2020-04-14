A demo chat application that demonstrates the usage of 
the [sse-eventbus](https://github.com/ralscha/sse-eventbus) library.

GUI is a clone of this project:    
https://github.com/didinj/ionic3-angular5-firebase-simple-chat

Emojitracker and RelativePipe are copied from this project:     
https://github.com/HsuanXyz/ionic3-chat

Automatic Scroll to Bottom with Mutation Observers:    
https://www.joshmorony.com/automatic-scroll-to-bottom-chat-interface-with-mutation-observers-in-ionic/


### Run the application locally

```
git clone https://github.com/ralscha/sse-eventbus-demo-chat.git
cd sse-eventbus-demo-chat
./mvnw package  (Windows: .\mvnw.cmd package)
java -jar target/tahc.jar
```
In another shell
```
cd sse-eventbus-demo-chat/client
npm install
ionic serve
```


### License
Code released under [the Apache license](http://www.apache.org/licenses/).
