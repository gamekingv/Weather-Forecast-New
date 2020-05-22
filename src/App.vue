<template>
    <v-app>
        <div class="weather-panel" v-if="htmlCode !== ''">
            <div v-html="htmlCode"></div>
        </div>
        <v-container class="grey darken-3 error-panel" fill-height v-else>
            <v-row>
                <v-col cols="12">
                    <v-row align="center" justify="center">
                        <v-icon class="display-4" color="red">mdi-close</v-icon>
                    </v-row>
                </v-col>
            </v-row>
        </v-container>
        <div
            :class="{'refresh-info': true,'tool-bar': true, 'refresh-state-none': state === 'none', 'red--text': state === 'fail', 'green--text': state === 'success'}"
        >{{message}}</div>
        <v-btn :loading="loading" @click.stop="updateInfo" class="refresh-button tool-bar" color="white" dark icon small>
            <v-icon>mdi-refresh</v-icon>
        </v-btn>
        <v-btn @click.stop="dialog = true" class="setting-button tool-bar" color="white" dark icon small>
            <v-icon>mdi-cog-outline</v-icon>
        </v-btn>
        <v-dialog max-width="400" v-model="dialog">
            <v-card dark>
                <v-card-title>
                    <v-row justify="space-between">
                        <v-col class="py-0">设置</v-col>
                        <v-col class="py-0 text-right">
                            <v-btn @click.stop="dialog = true" class="mr-4" color="green" dark icon small>
                                <v-icon>mdi-check</v-icon>
                            </v-btn>
                            <v-btn @click.stop="dialog = true" color="red" dark icon small>
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-card-title>
                <v-card-text class="pb-0">
                    <v-form>
                        <v-row>
                            <v-col class="pb-0">
                                <v-text-field color="primary" label="城市" placeholder="留空则自动获取" v-model="city"></v-text-field>
                            </v-col>
                            <v-col class="pb-0">
                                <v-text-field
                                    :rules="[rules.number]"
                                    color="primary"
                                    label="自动更新间隔"
                                    placeholder="默认为10"
                                    suffix="分钟"
                                    v-model="Interval"
                                ></v-text-field>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col class="py-0">
                                <v-checkbox class="mt-0" color="primary" label="显示天气图标" v-model="showIcon"></v-checkbox>
                            </v-col>
                            <v-col class="py-0">
                                <v-checkbox class="mt-0" color="primary" label="显示温度" v-model="showTemp"></v-checkbox>
                            </v-col>
                        </v-row>
                    </v-form>
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-app>
</template>

<script>
import browser from 'webextension-polyfill';
// import test from './test';

export default {
    name: 'App',
    created() {
        browser.runtime.sendMessage({ action: 'get info' }).then(({ response }) => {
            this.htmlCode = response;
        });
        // this.htmlCode = test.htmlCode;
        // this.htmlCode = '';
    },
    data: () => ({
        htmlCode: '',
        loading: false,
        state: 'normal',
        message: '',
        dialog: false,
        city: '',
        Interval: '',
        showIcon: true,
        showTemp: true,
        rules: {
            number: value => value === '' || !Number.isNaN(parseInt(value)) && parseInt(value) >= 1 || '请输入一个不少于1的数字'
        }
    }),
    methods: {
        updateInfo() {
            this.loading = true;
            browser.runtime.sendMessage({ action: 'update' }).then(({ response }) => {
                switch (response) {
                    case 'success': {
                        browser.runtime.sendMessage({ action: 'get info' }).then(({ response }) => {
                            this.state = 'success';
                            this.message = '更新成功';
                            this.htmlCode = response;
                            this.loading = false;
                            setTimeout(() => {
                                this.state = 'none';
                            }, 3000);
                        });
                        break;
                    }
                    case 'fail': {
                        browser.runtime.sendMessage({ action: 'get error message' }).then(({ response }) => {
                            this.state = 'fail';
                            this.message = response;
                            this.loading = false;
                            this.htmlCode = '';
                            setTimeout(() => {
                                this.state = 'none';
                            }, 3000);
                        });
                        break;
                    }
                }
            });
        }
    }
};
</script>

<style scoped>
.weather-panel {
    min-width: 538px;
}
.weather-panel >>> a {
    color: white;
}
.weather-panel >>> p {
    margin-bottom: 0;
}
.weather-panel >>> .c-container {
    font-size: 13px;
}
.weather-panel >>> .op_weather4_twoicon_bg,
.weather-panel >>> .op_weather4_twoicon {
    height: 268px !important;
}
.error-panel {
    width: 538px;
    height: 268px;
}
.tool-bar {
    position: absolute;
    top: 8px;
    z-index: 30;
}
.setting-button {
    right: 8px;
}
.refresh-button {
    right: 38px;
}
.refresh-info {
    right: 68px;
    top: 13px;
    text-align: right;
    color: white;
    font-size: 12px;
    pointer-events: none;
    transition: all 0.5s;
}
.refresh-state-none {
    opacity: 0;
}
</style>
