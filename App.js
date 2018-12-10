import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Permissions, Notifications } from 'expo';
import * as firebase from 'firebase';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC99dLG3rssDQITaLAAUfN9t7LL5u1jciE",
  authDomain: "expo-3da69.firebaseapp.com",
  databaseURL: "https://expo-3da69.firebaseio.com",
  storageBucket: "expo-3da69.appspot.com"
};
firebase.initializeApp(firebaseConfig);

const user = {
  id: 456
}

export default class App extends React.Component {
  state = {
    token: null,
    notification: {},
    backgroundColor: 'white'
  }

  componentDidMount() {
    this.getToken(user.id);
    this.registerForPushNotificationsAsync();

    // Handle notifications that are received or selected while the app
    // is open. If the app was closed and then opened by tapping the
    // notification (rather than just tapping the app icon to open it),
    // this function will fire on the next tick after the app starts
    // with the notification data.
    this._notificationSubscription = Notifications.addListener(this._handleNotification);
    Notifications.setBadgeNumberAsync(0);
  }

  componentWillUnmount() {
    this._notificationSubscription.remove();
  }

  _handleNotification = (notification) => {
    this.setState({
      notification: notification,
      backgroundColor: notification.data.backgroundColor ? notification.data.backgroundColor: 'white'
    });

    Notifications.setBadgeNumberAsync(0);
  };

  _handleClearBadgeNumberAsync = () => {
    if (this.state.notification.origin) {
      Notifications.setBadgeNumberAsync(0);
    }
  }
  
  registerForPushNotificationsAsync = async () => {
    const { status: existingStatus } = await Permissions.getAsync(
      Permissions.NOTIFICATIONS
    );
    let finalStatus = existingStatus;
  
    // only ask if permissions have not already been determined, because
    // iOS won't necessarily prompt the user a second time.
    if (existingStatus !== 'granted') {
      // Android remote notification permissions are granted during the app
      // install, so this will only ask on iOS
      const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
      finalStatus = status;
    }

    // Stop here if the user did not grant permissions
    if (finalStatus !== 'granted') {
      return;
    }

    let token = await Notifications.getExpoPushTokenAsync();
    
    this.storeToken(user.id, token);
  }

  storeToken = (userId, token) => {
    firebase.database().ref('users/' + userId).set({
      token: token
    });
  }

  getToken = (userId) => {
    firebase.database().ref('users/' + userId).on('value', (snapshot) => {
      const token = snapshot.val() ? snapshot.val().token: "";
      this.setState({ token });
    })
  }

  render() {
    return (
      <View style={[styles.container, {backgroundColor: this.state.backgroundColor}]}>
        <Text>Token: {this.state.token}</Text>
        {this.state.notification && (
          <View>
            <Text>Origin: {this.state.notification.origin}</Text>
            <Text>Data: {JSON.stringify(this.state.notification.data)}</Text>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
});
