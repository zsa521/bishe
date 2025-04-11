const app = getApp();
const db = wx.cloud.database();
const _ = db.command;

Page({
  nickName: '',

  data: {
    userInfo: {},
    hasUserInfo: false,
    showDialog: false,
  },

  onShowDialog() {
    this.setData({ showDialog: true });
  },

  onClose() {
    this.setData({ showDialog: false });
  },

  onChooseAvatar(e) {
    const that = this;

    wx.cloud.uploadFile({
      cloudPath: 'avatar/' + app.globalData.openid + '_' + new Date().getTime() + '_avatarImg.jpg',
      filePath: e.detail.avatarUrl,
    })
      .then((res) => {
        console.log(res.fileID, "path");
        that.setData({
          'userInfo.avatarUrl': res.fileID,
        });
      })
      .catch((error) => {
        console.error(error);
      });
  },

  nicknameBlur(e) {
    if (e.detail.value !== undefined) {
      this.nickName = e.detail.value;
    }
  },

  onConfirm() {
    const that = this;

    // if (!this.nickName || !this.data.userInfo.avatarUrl) {
    //   wx.showToast({
    //     icon: 'none',
    //     title: '请完善信息后再提交',
    //   });
    //   return;
    // }

    this.setData({
      'userInfo.nickName': this.nickName,
    });

    db.collection('user_info')
      .where({
        _openid: _.eq(app.globalData.openid),
      })
      .update({
        data: this.data.userInfo,
      })
      .then((res) => {
        console.log(res);
        app.globalData.userInfo = this.data.userInfo;
        wx.setStorageSync('userInfo', app.globalData.userInfo);

        wx.showToast({
          title: '登录成功',
        });

        this.setData({
          showDialog: false,
        });
      })
      .catch((err) => {
        console.error('更新用户信息失败', err);
        wx.showToast({
          icon: 'none',
          title: '登录失败，请稍后重试',
        });
      });
  },

  onLoad(options) {
    const userInfo = app.globalData.userInfo;

    if (userInfo && userInfo.nickName) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true,
      });
    } else {
      app.globalData.userInfo = {};
    }

    wx.getStorage({
      key: 'userInfo',
      success: (res) => {
        console.log(res, "getUserInfo");
        this.setData({
          userInfo: res.data,
          hasUserInfo: true,
        });
        app.globalData.userInfo = res.data;
        app.globalData.openid = wx.getStorageSync('openid');
      },
      fail: (err) => {
        console.log("fail:", err);
        this.addUserInfo();
      },
    });
  },

  addUserInfo() {
    if (!app.globalData.openid) {
      wx.cloud.callFunction({
        name: 'login',
        data: {},
      })
        .then((res) => {
          console.log(res.result);
          wx.setStorageSync('openid', res.result.openid);
          app.globalData.openid = res.result.openid;

          return db.collection('user_info').where({
            _openid: _.eq(res.result.openid),
          }).get();
        })
        .catch((err) => {
          wx.showToast({
            icon: 'none',
            title: '请检查登录状态',
          });
          console.error('[云函数] [login] 获取 openid 失败，请检查是否有部署云函数，错误信息：', err);
        })
        .then((res) => {
          console.log('获取用户信息成功', res);

          if (res.data.length > 0) {
            const { nickName, avatarUrl } = res.data[0];
            this.setData({
              userInfo: { nickName, avatarUrl },
              hasUserInfo: true,
            });
            app.globalData.userInfo = { nickName, avatarUrl };
            wx.setStorageSync("userInfo", { nickName, avatarUrl });
          } else {
            const defaultUserInfo = {
              avatarUrl: "https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132",
              nickName: "微信用户",
            };

            app.globalData.userInfo = defaultUserInfo;
            wx.setStorageSync("userInfo", defaultUserInfo);

            this.setData({
              userInfo: app.globalData.userInfo,
              hasUserInfo: true,
            });

            return db.collection('user_info').add({
              data: defaultUserInfo,
            });
          }
        })
        .catch((err) => {
          console.error('查询用户信息失败', err);
        })
        .then((res) => {
          console.log('添加用户信息成功', res);
        })
        .catch((err) => {
          console.error('添加用户信息失败', err);
        });
    }
  },
});