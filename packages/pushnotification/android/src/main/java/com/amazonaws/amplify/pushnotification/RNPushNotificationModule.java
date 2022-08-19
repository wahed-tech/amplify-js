/*
 * Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

package com.amazonaws.amplify.pushnotification;

import android.util.Log;
import android.app.Application;
import android.content.IntentFilter;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.messaging.FirebaseMessaging;
import androidx.annotation.NonNull;

import com.amazonaws.amplify.pushnotification.modules.RNPushNotificationBroadcastReceiver;

public class RNPushNotificationModule extends ReactContextBaseJavaModule {
    private static final String LOG_TAG = "RNPushNotificationModule";

    public RNPushNotificationModule(ReactApplicationContext reactContext) {
        super(reactContext);
        Log.i(LOG_TAG, "constructing RNPushNotificationModule");
    }

    @Override
    public String getName() {
        return "RNPushNotification";
    }


    @ReactMethod
    public void getToken(final Callback onSuccessCallback, final Callback onErrorCallback) {
        FirebaseMessaging.getInstance().getToken().addOnCompleteListener(new OnCompleteListener<String>() {
                @Override
                public void onComplete(@NonNull Task<String> task) {
                    if (task.isSuccessful()) {
                        String token = task.getResult();
                        Log.i(LOG_TAG, "got token " + token);
                        onSuccessCallback.invoke(token);
                    } else {
                        Exception exception = task.getException();
                        if (exception != null) {
                            String exceptionMessage = exception.getMessage();
                            Log.e(LOG_TAG, "Error getting token: " + exceptionMessage);
                            onErrorCallback.invoke(exceptionMessage);
                        }
                    }
                }
            });
    }
}
