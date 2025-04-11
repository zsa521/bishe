// pages/publish/publish.js
const citySelector = requirePlugin('citySelector');
const app = getApp();
const db = wx.cloud.database();
const _ = db.command;

Page({
  category: '', // 订单分类
  pickUpLocation: undefined, // 取件位置
  arrivalLocation: undefined, // 送达位置

  /**
   * 页面的初始数据
   */
  data: {
    id: '', // 订单 ID，用于判断是新增订单还是更新订单
    title: '', // 标题
    message: '', // 备注信息
    tel: '', // 联系电话
    chooseLocationBtnIndex: 1, // 按钮索引，1 表示取件地址，2 表示送达地址
    pickUpAddress: '', // 取件地址
    arrivalAddress: '', // 送达地址
    showArrivalTimePopup: false, // 是否显示送达时间弹出层
    arrivalTime: '', // 送达时间
    showSizesPopup: false, // 是否显示物品尺寸弹出层
    itemSize: '小件', // 物品尺寸
    sizes: ['特小件', '小件', '中件', '大件', '特大件'], // 物品尺寸选项
    reward: 1, // 奖励金额
    locationAuth: false, // 是否已获得位置授权
  },

  /**
   * 点击选择送达时间
   */
  onClickArrivalTime() {
    this.setData({ showArrivalTimePopup: true });
  },

  /**
   * 关闭送达时间弹出层
   */
  onCloseArrivalTimePopup() {
    this.setData({ showArrivalTimePopup: false });
  },

  /**
   * 确认送达时间
   */
  onConfirmArrivalTime(event) {
    this.setData({
      arrivalTime: event.detail,
      showArrivalTimePopup: false,
    });
  },

  /**
   * 点击选择物品尺寸
   */
  onClickItemSize() {
    this.setData({ showSizesPopup: true });
  },

  /**
   * 关闭物品尺寸弹出层
   */
  onCloseSizesPopup() {
    this.setData({ showSizesPopup: false });
  },

  /**
   * 确认物品尺寸
   */
  onConfirmItemSize(event) {
    this.setData({
      itemSize: event.detail.value,
      showSizesPopup: false,
    });
  },

  /**
   * 奖励金额变化
   */
  onChangeReward(event) {
    this.setData({
      reward: event.detail,
    });
  },

  /**
   * 表单提交
   */
  formSubmit(e) {
    if (!app.globalData.openid) {
      wx.showToast({
        icon: 'none',
        title: '请先登录',
      });
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/mine/mine',
        });
      }, 2000);
      return;
    }

    const { arrivalTime, itemSize, reward } = this.data;
    const { pickUpAddress, arrivalAddress, title, message, tel } = e.detail.value;

    // 校验手机号格式
    const isPhoneNumberValid = (tel) => /^1[3-9]\d{9}$/.test(tel);
    if (!isPhoneNumberValid(tel)) {
      wx.showToast({
        icon: 'none',
        title: '请输入有效的手机号',
      });
      return;
    }

    // 校验表单是否完整
    if (!(pickUpAddress && arrivalAddress && arrivalTime && itemSize && title && tel && reward)) {
      wx.showToast({
        icon: 'none',
        title: '请填写完整信息',
      });
      return;
    }

    wx.showLoading({
      title: '正在发布...',
    });

    console.log('开始提交订单:', {
      category: this.category,
      reward: Number(reward),
      tel: tel,
      message: message,
      title: title,
      pickUpAddress: pickUpAddress,
      arrivalAddress: arrivalAddress,
      arrivalTime: arrivalTime,
      pickUpLocation: this.pickUpLocation ? db.Geo.Point(this.pickUpLocation.longitude, this.pickUpLocation.latitude) : null,
      arrivalLocation: this.arrivalLocation ? db.Geo.Point(this.arrivalLocation.longitude, this.arrivalLocation.latitude) : null,
      addtime: db.serverDate(),
      itemSize: itemSize,
      status: '待接单',
    });

    // 判断是新增订单还是更新订单
    if (this.data.id) {
      // 更新订单
      db.collection('order_list')
        .doc(this.data.id)
        .update({
          data: {
            category: this.category,
            reward: Number(reward),
            tel: tel,
            message: message,
            title: title,
            pickUpAddress: pickUpAddress,
            arrivalAddress: arrivalAddress,
            arrivalTime: arrivalTime,
            pickUpLocation: this.pickUpLocation ? db.Geo.Point(this.pickUpLocation.longitude, this.pickUpLocation.latitude) : null,
            arrivalLocation: this.arrivalLocation ? db.Geo.Point(this.arrivalLocation.longitude, this.arrivalLocation.latitude) : null,
            addtime: db.serverDate(),
            itemSize: itemSize,
            status: '待接单',
          },
        })
        .then((res) => {
          console.log('更新成功', res);
          wx.hideLoading();
          wx.showToast({
            icon: 'success',
            title: '更新成功',
          });
          wx.redirectTo({
            url: '/pages/orders/orders',
          });
        })
        .catch((err) => {
          console.error('更新失败', err);
          wx.hideLoading();
          wx.showToast({
            icon: 'none',
            title: '更新失败，请稍后重试',
          });
        });
    } else {
      // 新增订单
      db.collection('order_list')
        .add({
          data: {
            category: this.category,
            reward: Number(reward),
            tel: tel,
            message: message,
            title: title,
            pickUpAddress: pickUpAddress,
            arrivalAddress: arrivalAddress,
            arrivalTime: arrivalTime,
            pickUpLocation: this.pickUpLocation ? db.Geo.Point(this.pickUpLocation.longitude, this.pickUpLocation.latitude) : null,
            arrivalLocation: this.arrivalLocation ? db.Geo.Point(this.arrivalLocation.longitude, this.arrivalLocation.latitude) : null,
            addtime: db.serverDate(),
            itemSize: itemSize,
            status: '待接单',
          },
        })
        .then((res) => {
          console.log('发布成功', res);
          wx.hideLoading();
          wx.showToast({
            icon: 'success',
            title: '发布成功',
          });
          wx.redirectTo({
            url: '/pages/orders/orders',
          });
        })
        .catch((err) => {
          console.error('发布失败', err);
          wx.hideLoading();
          wx.showToast({
            icon: 'none',
            title: '发布失败，请稍后重试',
          });
        });
    }
  },

  /**
   * 打开城市选择器
   */
  onChooseLocation(e) {
    if (!this.data.locationAuth) {
      wx.showToast({ icon: 'none', title: '请允许位置访问', });
      return;
    }

    this.setData({ chooseLocationBtnIndex: e.currentTarget.dataset.btnIndex || 1 }); // 动态设置按钮索引

    const key = 'AJUBZ-SE7E4-7PHUH-FE4D2-EUBE7-CGFSJ'; // 替换为你的腾讯位置服务 Key
    const referer = '永不重名的账号'; // 替换为你的小程序名称
    const hotCitys = '北京'; // 自定义热门城市

    wx.navigateTo({
      url: `plugin://citySelector/index?key=${key}&referer=${referer}&hotCitys=${hotCitys}`,
      success: () => {
        console.log('跳转到城市选择器成功');
      },
      fail: (err) => {
        console.error('跳转到城市选择器失败:', err);
        wx.showToast({
          icon: 'none',
          title: '跳转失败，请稍后重试',
        });
      },
    });
  },

  /**
   * 页面加载时处理参数
   */
  onLoad(options) {
    this.checkLocationPermission(); // 检查位置权限

    if (options.id) {
      // 如果有订单 ID，则为更新订单
      db.collection('order_list')
        .doc(options.id)
        .get()
        .then((res) => {
          const data = res.data;
          this.category = data.category;
          this.pickUpLocation = data.pickUpLocation;
          this.arrivalLocation = data.arrivalLocation;

          this.setData({
            id: data._id,
            title: data.title,
            message: data.message,
            tel: data.tel,
            pickUpAddress: data.pickUpAddress,
            arrivalAddress: data.arrivalAddress,
            arrivalTime: data.arrivalTime,
            itemSize: data.itemSize,
            reward: data.reward,
          });

          wx.setNavigationBarTitle({
            title: '修改订单',
          });
        })
        .catch((err) => {
          console.error('获取订单详情失败', err);
          wx.showToast({
            icon: 'none',
            title: '加载订单失败，请稍后重试',
          });
        });
    } else if (options.category) {
      // 如果有分类，则为新增订单
      this.category = options.category;
      wx.setNavigationBarTitle({
        title: options.category,
      });
    }
  },

  /**
   * 检查并请求位置权限的方法
   */
  checkLocationPermission() {
    wx.getSetting({
      success: res => {
        if (!res.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => this.setData({ locationAuth: true }),
            fail: () => {
              wx.showModal({
                title: '提示',
                content: '需要您的地理位置信息才能正常使用此功能，请前往设置打开权限。',
                showCancel: false,
                success: (res) => {
                  if (res.confirm) {
                    console.log('用户点击确定');
                    wx.openSetting({
                      success(settingData) {
                        console.log(settingData);
                      }
                    });
                  }
                }
              });
            },
          });
        } else {
          this.setData({ locationAuth: true });
        }
      },
    });
  },

  /**
   * 页面显示时获取城市选择器结果
   */
  onShow() {
    try {
      const location = citySelector.getCity(); // 获取选点结果
      if (location) {
        if (this.data.chooseLocationBtnIndex == 1) {
          this.pickUpLocation = location;
          this.setData({
            pickUpAddress: location.name,
          });
        } else {
          this.arrivalLocation = location;
          this.setData({
            arrivalAddress: location.name,
          });
        }
      }
    } catch (error) {
      console.error('获取城市信息失败:', error);
      wx.showToast({
        icon: 'none',
        title: '获取城市信息失败，请稍后重试',
      });
    }
  },

  /**
   * 页面卸载时清理插件数据
   */
  onUnload() {
    try {
      citySelector.setLocation(null); // 清理插件选点数据
    } catch (error) {
      console.warn('清理插件数据失败:', error);
    }
  },
});



