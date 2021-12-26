const util = require("util");
const pkg = require("./package.json");
const exec = util.promisify(require("child_process").exec);

(async function () {
  try {
    console.log("上传到 nas");

    // await exec(
    //   `scp -P 5022 dist/network-rc.tar.gz itiwll@192.168.50.2:/volume1/web/network-rc/download/network-rc.tar.gz`
    // );

    // await exec(
    //   `scp -P 5022 dist/network-rc.tar.gz itiwll@192.168.50.2:/volume1/web/network-rc/download/network-rc-v${pkg.version}.tar.gz`
    // );

    console.log("上传 一键安装脚本");

    await exec(
      `scp -P 29168 ./install.sh root@download.esonwong.com:/www/download/network-rc/install.sh`
    );

    console.log("上传 network-rc.tar.gz 到 download.esonwong.com");

    await exec(
      `scp -P 29168 dist/network-rc.tar.gz root@download.esonwong.com:/www/download/network-rc/network-rc.tar.gz`
    );

    console.log(
      `上传 network-rc-v${pkg.version}.tar.gz 到 download.esonwong.com`
    );

    await exec(
      `scp -P 29168 dist/network-rc.tar.gz root@download.esonwong.com:/www/download/network-rc/network-rc-v${pkg.version}.tar.gz`
    );
  } catch (e) {
    console.error(e);
  }
})();
