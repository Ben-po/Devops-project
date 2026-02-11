pipeline {
  agent any

  environment {
    IMAGE_NAME = "devops-app"
    IMAGE_TAG  = "${env.BUILD_NUMBER}"
    KUBECONFIG = "/tmp/kubeconfig-linux"
  }

  tools {
    nodejs "node18"
  }

  stages {

    stage("Checkout") {
      steps {
        checkout scm
      }
    }

    stage("Install Dependencies") {
      steps {
        sh "npm ci"
      }
    }

    stage("Run Tests") {
      steps {
        sh '''
          echo "--- Backend + Frontend tests ---"
          npm run test:my:coverage
        '''
      }
    }

    stage("Tools Check") {
      steps {
        sh '''
          echo "--- TOOL VERSIONS ---"
          node -v
          npm -v
          kubectl version --client
          minikube version
        '''
      }
    }

    stage("Build Docker Image (Minikube)") {
      steps {
        sh "minikube image build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
        sh "minikube image list | grep ${IMAGE_NAME} || true"
      }
    }

    stage("Deploy to Minikube") {
      steps {
        sh '''
          set -eux

          cat > /tmp/kubeconfig-linux <<'EOF'
apiVersion: v1
kind: Config
clusters:
- name: minikube
  cluster:
    certificate-authority: /var/jenkins_home/.minikube/ca.crt
    server: https://192.168.49.2:8443
contexts:
- name: minikube
  context:
    cluster: minikube
    user: minikube
current-context: minikube
users:
- name: minikube
  user:
    client-certificate: /var/jenkins_home/.minikube/profiles/minikube/client.crt
    client-key: /var/jenkins_home/.minikube/profiles/minikube/client.key
EOF

          export KUBECONFIG=/tmp/kubeconfig-linux

          kubectl get nodes
          kubectl apply --validate=false -f k8s/deployment.yaml
          kubectl apply --validate=false -f k8s/service.yaml

          kubectl set image deployment/devops-app devops-app=${IMAGE_NAME}:${IMAGE_TAG}
          kubectl rollout status deployment/devops-app --timeout=120s

          kubectl get pods -o wide
          kubectl get svc
        '''
      }
    }
  }

  post {
    success {
      echo "CI/CD Pipeline SUCCESSFUL"
      emailext(
        to: 'nathanielchengyx@gmail.com',
        subject: "SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        mimeType: 'text/html',
        body: """Build SUCCESS<br/>
Job: ${env.JOB_NAME}<br/>
Build: #${env.BUILD_NUMBER}<br/>
URL: ${env.BUILD_URL}<br/>"""
      )
    }

    failure {
      echo "Pipeline failed — check console logs"
      emailext(
        to: 'nathanielchengyx@gmail.com',
        subject: "FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        mimeType: 'text/html',
        body: """Build FAILED<br/>
Job: ${env.JOB_NAME}<br/>
Build: #${env.BUILD_NUMBER}<br/>
URL: ${env.BUILD_URL}<br/>
Check Console Output for errors."""
      )
    }

    always {
      echo "Pipeline finished (success or failure)."
    }
  }
}
